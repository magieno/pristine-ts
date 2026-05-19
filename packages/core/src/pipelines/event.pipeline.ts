import {DependencyContainer, inject, injectable, injectAll} from "tsyringe";
import {ExecutionContextInterface} from "../interfaces/execution-context.interface";
import {EventInterceptorInterface} from "../interfaces/event-interceptor.interface";
import {EventMapperInterface} from "../interfaces/event-mapper.interface";
import {Event} from "../models/event";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {EventsExecutionOptionsInterface} from "../interfaces/events-execution-options.interface";
import {EventResponse} from "../models/event.response";
import {EventDispatcherInterface} from "../interfaces/event-dispatcher.interface";
import {EventContext, EventContextManager, PristineError, PristineErrorKind, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {SpanKeynameEnum, TracingManagerInterface} from "@pristine-ts/telemetry";
import {CoreModuleKeyname} from "../core.module.keyname";
import {CoreErrorCode} from "../errors/core-error-code.enum";

@injectable()
export class EventPipeline {

  public constructor(
    @injectAll(ServiceDefinitionTagEnum.EventInterceptor) private readonly eventInterceptors: EventInterceptorInterface[],
    @injectAll(ServiceDefinitionTagEnum.EventMapper) private readonly eventMappers: EventMapperInterface<any, any>[],
    @inject('LogHandlerInterface') private readonly logHandler: LogHandlerInterface,
    @inject("TracingManagerInterface") private readonly tracingManager: TracingManagerInterface,
    private readonly eventContextManager: EventContextManager,
  ) {
  }

  /**
   * Builds the per-event `EventContext` and runs `fn` inside it. Centralizes the ALS
   * boundary so the sequential and parallel execution paths in `execute()` install the
   * same shape of context. Downstream code (`LogHandler.eventId` fallback, `@traced`)
   * reads from this context instead of receiving everything threaded through method
   * parameters.
   */
  private runWithEventContext<T>(event: Event<any>, childContainer: DependencyContainer, fn: () => Promise<T>): Promise<T> {
    const ctx = new EventContext();
    ctx.eventId = event.id;
    ctx.container = childContainer;
    // Propagate the kernel-started trace into the EventContext so any TracingManager
    // instance resolved from a child container (controllers, CLI commands, etc.) sees
    // the same active trace as the kernel did when it called startTracing(). Without
    // this, the kernel writes the trace to its root-container TracingManager's
    // `this.trace` fallback, but per-event code reads from EventContext.trace and
    // finds nothing — addEventToCurrentSpan would warn "outside any active trace."
    ctx.trace = this.tracingManager.trace;
    // Stash the kernel's TracingManager on the context so `@traced` uses the manager
    // that owns the trace, not a fresh ContainerScoped instance the child container
    // would build on first resolve.
    ctx.tracingManager = this.tracingManager;
    return this.eventContextManager.run(ctx, fn);
  }

  /**
   *
   * @param event
   * @param executionContext
   * @param container
   */
  async execute(event: object, executionContext: ExecutionContextInterface<any>, container: DependencyContainer): Promise<any> {
    const eventExecutions: EventsExecutionOptionsInterface<any>[] = [];

    // If the event passed is already properly typed, we simply execute it, without mapping and without calling the pre-mapping interceptors
    if (event instanceof Event) {
      eventExecutions.push({
        events: [event],
        executionOrder: "sequential",
      })
    } else {
      // 1- We have the raw event, we start by executing the PreMapping Interceptors
      const interceptedEvent = await this.preMappingIntercept(event, executionContext);

      // 2- With the intercepted raw event, run the Events Mapping to get all the Events and the EventsExecutionOptions.
      // For each event mapper that supports the event, we batch the executions for each mapper. So it's possible to execute the same
      // event twice. This is up to the EventMappers to properly identify when they map or don't map an event. Pristine
      // isn't responsible to determine if two events are executed twice, so be careful.
      let numberOfEventMappers = 0;

      try {
        const span = this.tracingManager.startSpan(SpanKeynameEnum.EventMapping);

        this.eventMappers.forEach(eventMapper => {
          if (eventMapper.supportsMapping(interceptedEvent, executionContext)) {
            eventExecutions.push(eventMapper.map(interceptedEvent, executionContext));
            numberOfEventMappers++;
          }
        })

        span.end();
      } catch (error) {
        throw new PristineError("There was an error mapping the event into an Event object", {
          code: CoreErrorCode.EventMappingFailed, kind: PristineErrorKind.SystemError, cause: error as Error,
          details: {event, interceptedEvent, executionContext},
        })
      }

      if (numberOfEventMappers === 0) {
        throw new PristineError("There are no Event Mappers that support the event", {
          code: CoreErrorCode.EventNoMapperSupports, kind: PristineErrorKind.SystemError,
          details: {event, interceptedEvent, executionContext},
        });
      }

      if (eventExecutions.length === 0 || eventExecutions.reduce((agg, eventExecution) => {
        return agg + eventExecution.events.length;
      }, 0) === 0) {
        throw new PristineError("There are no events to execute.", {
          code: CoreErrorCode.EventNoEvents, kind: PristineErrorKind.SystemError,
          details: {event, interceptedEvent, executionContext},
        })
      }
    }

    const eventsExecutionPromises: Promise<EventResponse<any, any> | EventResponse<any, any>[]>[] = [];

    // 3- Loop over the EventExecutionOptions array and start executing the events
    eventExecutions.forEach(eventExecutionOptions => {
      switch (eventExecutionOptions.executionOrder) {
        case 'sequential':
          eventsExecutionPromises.push(new Promise<EventResponse<any, any>[]>(async (resolve, reject) => {
            // await all events and then resolve.
            const eventResponses = [];

            for (const event of eventExecutionOptions.events) {
              let span = this.tracingManager.startSpan(SpanKeynameEnum.ChildContainerCreation);
              const childContainer = container.createChildContainer() as DependencyContainer;
              span.end();

              // It's important to register the CurrentChildContainer since even though it's not 100% recommended,
              // some handlers might want to retrieve the container. For example, the RequestHandler needs this mechanism
              // to dynamically load the controllers and not load all the containers all the time.
              span = this.tracingManager.startSpan(SpanKeynameEnum.ChildContainerRegistration);
              childContainer.register(ServiceDefinitionTagEnum.CurrentChildContainer, {
                useValue: childContainer,
              });
              span.end();

              span = this.tracingManager.startSpan(SpanKeynameEnum.EventDispatcherResolver);
              // ── container.resolve, justified ──────────────────────────────────
              // Per CLAUDE.md: framework-internal per-event dispatch. The child
              // container was just created on the line above; the dispatcher must
              // come from THAT container so it sees the right per-event services.
              // Constructor-injecting it would bind to the kernel container's
              // instance, not the per-event one.
              const eventDispatcher = childContainer.resolve("EventDispatcherInterface") as EventDispatcherInterface;
              span.end();

              try {
                // Install the per-event ALS context so downstream code (LogHandler
                // eventId fallback, `@traced`, etc.) sees the right values without
                // needing them threaded through every call site.
                eventResponses.push(await this.runWithEventContext(event, childContainer, () =>
                  this.executeEvent(event, eventDispatcher)
                ));
              } catch (error) {
                return reject(error);
              }
            }

            return resolve(eventResponses);
          }))
          break;
        case 'parallel':
          for (const event of eventExecutionOptions.events) {
            eventsExecutionPromises.push(new Promise<EventResponse<any, any> | EventResponse<any, any>[]>(async (resolve, reject) => {
              let span = this.tracingManager.startSpan(SpanKeynameEnum.ChildContainerCreation);
              const childContainer = container.createChildContainer();
              span.end();

              // It's important to register the CurrentChildContainer since even though it's not 100% recommended,
              // some handlers might want to retrieve the container. For example, the RequestHandler needs this mechanism
              // to dynamically load the controllers and not load all the containers all the time.
              span = this.tracingManager.startSpan(SpanKeynameEnum.ChildContainerRegistration);
              childContainer.register(ServiceDefinitionTagEnum.CurrentChildContainer, {
                useValue: childContainer,
              });
              span.end();

              span = this.tracingManager.startSpan(SpanKeynameEnum.EventDispatcherResolver);
              // ── container.resolve, justified ──────────────────────────────────
              // Per CLAUDE.md: framework-internal per-event dispatch. The child
              // container was just created on the line above; the dispatcher must
              // come from THAT container so it sees the right per-event services.
              // Constructor-injecting it would bind to the kernel container's
              // instance, not the per-event one.
              const eventDispatcher = childContainer.resolve("EventDispatcherInterface") as EventDispatcherInterface;
              span.end();

              // Install the per-event ALS context for parallel-path execution too. Each
              // event in the batch gets its own EventContext (concurrent run() calls
              // are isolated by AsyncLocalStorage).
              this.runWithEventContext(event, childContainer, () =>
                this.executeEvent(event, eventDispatcher)
              ).then(eventResponse => resolve(eventResponse)).catch(error => reject(error));
            }));
          }
          break;
      }
    })

    // 4- For each event, call the PreResponseMapping Interceptors
    const eventResponses: EventResponse<any, any>[] = await Promise.all((await Promise.all(eventsExecutionPromises)).flat().map(async eventResponse => await this.preResponseMappingIntercept(eventResponse)));

    let finalResponse = {};

    // 5 - Construct the final response by calling the events mapper (reverse map method) for each eventResponse;
    // This method updates the response object that will be returned from the kernel.
    eventResponses.forEach(eventResponse => {
      this.eventMappers.forEach(eventMapper => {
        if (eventMapper.supportsReverseMapping(eventResponse, finalResponse, executionContext)) {
          finalResponse = eventMapper.reverseMap(eventResponse, finalResponse, executionContext);
        }
      })
    })

    // 6 - Call the PostResponseMapping interceptors and return the final intercepted response.
    const postResponseMappingInterceptedResponse = await this.postResponseMappingIntercept(finalResponse);

    return postResponseMappingInterceptedResponse;
  }

  /**
   * This method calls the interceptors that are to be executed just before the EventMappers are executed. It allows
   * for changing the raw event coming directly into the kernel.
   *
   * @param event
   * @param executionContext
   * @private
   */
  private async preMappingIntercept(event: object, executionContext: ExecutionContextInterface<any>): Promise<object> {
    let interceptedEvent = event;

    const span = this.tracingManager.startSpan(SpanKeynameEnum.EventPreMappingInterception);

    for (const eventInterceptor of this.eventInterceptors) {
      try {
        interceptedEvent = await eventInterceptor.preMappingIntercept?.(interceptedEvent, executionContext) ?? interceptedEvent;
      } catch (error) {
        throw new PristineError("There was an error while executing the PreMapping Event interceptors", {
          code: CoreErrorCode.EventPreMappingInterceptorFailed, kind: PristineErrorKind.SystemError, cause: error as Error,
          details: {interceptorName: eventInterceptor.constructor.name, event, executionContext},
        });
      }
    }

    span.end();

    return interceptedEvent;
  }

  /**
   * This method calls the interceptors that are executed just after the EventMappers have mapped the raw event into
   * an Event object.
   *
   * @param event
   * @private
   */
  private async postMappingIntercept(event: Event<any>): Promise<Event<any>> {
    let interceptedEvent = event;

    const span = this.tracingManager.startSpan(SpanKeynameEnum.EventPostMappingInterception);

    for (const eventInterceptor of this.eventInterceptors) {
      try {
        interceptedEvent = await eventInterceptor.postMappingIntercept?.(interceptedEvent) ?? interceptedEvent;
      } catch (error) {
        throw new PristineError("There was an error while executing the PostMapping Event interceptors", {
          code: CoreErrorCode.EventPostMappingInterceptorFailed, kind: PristineErrorKind.SystemError, cause: error as Error,
          details: {interceptorName: eventInterceptor.constructor.name, event},
        });
      }
    }

    span.end();

    return interceptedEvent;
  }

  /**
   * This method calls the interceptors that are to be executed just after the EventResponse has been returned from
   * the EventDispatcher but before it is reverse mapped by the EventMappers.
   *
   * @param eventResponse
   * @private
   */
  private async preResponseMappingIntercept(eventResponse: EventResponse<any, any>): Promise<EventResponse<any, any>> {
    let interceptedEventResponse = eventResponse;

    const span = this.tracingManager.startSpan(SpanKeynameEnum.EventPreResponseMappingInterception);

    for (const eventInterceptor of this.eventInterceptors) {
      try {
        interceptedEventResponse = await eventInterceptor.preResponseMappingIntercept?.(interceptedEventResponse) ?? interceptedEventResponse;
      } catch (error) {
        throw new PristineError("There was an error while executing the PreResponseMapping Event interceptors", {
          code: CoreErrorCode.EventPreResponseInterceptorFailed, kind: PristineErrorKind.SystemError, cause: error as Error,
          details: {interceptorName: eventInterceptor.constructor.name, eventResponse},
        });
      }
    }

    span.end();

    return interceptedEventResponse;
  }

  /**
   * This method calls the interceptors that are executed after the EventResponse object has been mapped into a simple
   * object.
   *
   * @param eventResponse The event response object to be returned from the handle method in the kernel.
   * @private
   */
  private async postResponseMappingIntercept(eventResponse: object): Promise<object> {
    let interceptedEventResponse = eventResponse;

    const span = this.tracingManager.startSpan(SpanKeynameEnum.EventPostResponseMappingInterception);

    for (const eventInterceptor of this.eventInterceptors) {
      try {
        interceptedEventResponse = await eventInterceptor.postResponseMappingIntercept?.(interceptedEventResponse) ?? interceptedEventResponse;
      } catch (error) {
        throw new PristineError("There was an error while executing the PostResponseMapping Event interceptors", {
          code: CoreErrorCode.EventPostResponseInterceptorFailed, kind: PristineErrorKind.SystemError, cause: error as Error,
          details: {interceptorName: eventInterceptor.constructor.name, eventResponse},
        });
      }
    }

    span.end();

    return interceptedEventResponse;
  }

  /**
   * This method executes the postMappingInterceptors and then dispatches the Event by using the EventDispatcher.
   *
   * @param event This is the event that must be dispatched.
   * @param eventDispatcher This is the eventDispatcher instance that will dispatch the Event.
   * @private
   */
  private async executeEvent(event: Event<any>, eventDispatcher: EventDispatcherInterface): Promise<EventResponse<any, any>> {
    // 1 - Run the post mapped interceptors on every single event before they get executed.
    const interceptedEvent = await this.postMappingIntercept(event)

    try {
      const eventExecutionSpan = this.tracingManager.startSpan(SpanKeynameEnum.EventExecution);

      // 2 - Call the EventDispatcher and retrieve the Event Response
      const response = await eventDispatcher.dispatch(interceptedEvent);

      eventExecutionSpan.end();

      this.logHandler.debug("EventPipeline: Event dispatched successfully.", {
        extra: {
          event,
          response,
        },
      })

      return response;
    } catch (error) {
      this.logHandler.error("EventPipeline: There was an error while dispatching the event.", {
        extra: {
          error,
          interceptedEvent,
        },
      })
      // Re-throw the original error so its type and `instanceof` identity survive — the
      // typed PristineError (e.g. NotFoundError, ValidationError) thrown by the controller
      // must reach the channel responders intact. Pipeline context is logged above.
      throw error;
    }
  }
}
