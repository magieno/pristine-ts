import {injectable, DependencyContainer, injectAll, inject} from "tsyringe";
import {ExecutionContextInterface} from "../interfaces/execution-context.interface";
import {EventInterceptorInterface} from "../interfaces/event-interceptor.interface";
import {EventMapperInterface} from "../interfaces/event-mapper.interface";
import {Event} from "../models/event";
import {BreadcrumbHandlerInterface, LogHandlerInterface} from "@pristine-ts/logging";
import {EventsExecutionOptionsInterface} from "../interfaces/events-execution-options.interface";
import {EventResponse} from "../models/event.response";
import {EventDispatcher} from "../dispatchers/event.dispatcher";
import {EventDispatcherInterface} from "../interfaces/event-dispatcher.interface";
import {ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {EventMappingError} from "../errors/event-mapping.error";
import {EventPreMappingInterceptionError} from "../errors/event-pre-mapping-interception.error";
import {EventPostMappingInterceptionError} from "../errors/event-post-mapping-interception.error";
import {EventDispatchingError} from "../errors/event-dispatching.error";
import {EventPreResponseMappingInterceptionError} from "../errors/event-pre-response-mapping-interception.error";
import {EventPostResponseMappingInterceptionError} from "../errors/event-post-response-mapping-interception.error";
import {SpanKeynameEnum, TracingManagerInterface} from "@pristine-ts/telemetry";
import {CoreModuleKeyname} from "../core.module.keyname";

@injectable()
export class EventPipeline {

    public constructor(
        @injectAll(ServiceDefinitionTagEnum.EventInterceptor) private readonly eventInterceptors: EventInterceptorInterface[],
        @injectAll(ServiceDefinitionTagEnum.EventMapper) private readonly eventMappers: EventMapperInterface<any, any>[],
        @inject('LogHandlerInterface') private readonly logHandler: LogHandlerInterface,
        @inject("TracingManagerInterface") private readonly tracingManager: TracingManagerInterface,
        @inject("BreadcrumbHandlerInterface") private readonly breadcrumbHandler: BreadcrumbHandlerInterface,
    ) {
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
                throw new EventPreMappingInterceptionError("There was an error while executing the PreMapping Event interceptors", error as Error, eventInterceptor.constructor.name, event, executionContext);
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
                throw new EventPostMappingInterceptionError("There was an error while executing the PostMapping Event interceptors", error as Error, eventInterceptor.constructor.name, event);
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
                throw new EventPreResponseMappingInterceptionError("There was an error while executing the PreResponseMapping Event interceptors", error as Error, eventInterceptor.constructor.name, eventResponse);
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
                throw new EventPostResponseMappingInterceptionError("There was an error while executing the PostResponseMapping Event interceptors", error as Error, eventInterceptor.constructor.name, eventResponse);
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
        this.breadcrumbHandler.add(event.id, `${CoreModuleKeyname}:event.pipeline:executeEvent:enter`)
        // 1 - Run the post mapped interceptors on every single event before they get executed.
        const interceptedEvent = await this.postMappingIntercept(event)

        try {
            const eventExecutionSpan = this.tracingManager.startSpan(SpanKeynameEnum.EventExecution);

            // 2 - Call the EventDispatcher and retrieve the Event Response
            const response = await eventDispatcher.dispatch(interceptedEvent);

            eventExecutionSpan.end();

            this.logHandler.info("EventPipeline: Event dispatched successfully.", {
              eventId: event.id,
              breadcrumb: `${CoreModuleKeyname}:event.pipeline:executeEvent:return`,
              extra: {
                event,
                response,
              },
              outputHints: {
                outputBreadcrumbs: true,
              }
            })
            //this.breadcrumbHandler.reset(event.id);

            return response;
        } catch (error) {
            this.logHandler.error("EventPipeline: There was an error while dispatching the event.", {
                extra: {
                    error,
                    interceptedEvent,
                }
            })
            throw new EventDispatchingError(`There was an error while dispatching the event: '${error}'`, error as Error, interceptedEvent);
        }
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
        if(event instanceof Event) {
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
                throw new EventMappingError("There was an error mapping the event into an Event object", event, interceptedEvent, executionContext, error as Error)
            }

            if (numberOfEventMappers === 0) {
                throw new EventMappingError("There are no Event Mappers that support the event", event, interceptedEvent, executionContext);
            }

            if (eventExecutions.length === 0 || eventExecutions.reduce((agg, eventExecution) => {
                return agg + eventExecution.events.length;
            }, 0) === 0) {
                throw new EventMappingError("There are no events to execute.", event, interceptedEvent, executionContext)
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
                            const eventDispatcher = childContainer.resolve("EventDispatcherInterface") as EventDispatcherInterface;
                            span.end();

                            try {
                                eventResponses.push(await this.executeEvent(event, eventDispatcher));
                            }
                            catch (error) {
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
                            const eventDispatcher = childContainer.resolve("EventDispatcherInterface") as EventDispatcherInterface;
                            span.end();

                            this.executeEvent(event, eventDispatcher).then(eventResponse => resolve(eventResponse)).catch(error => reject(error));
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
}
