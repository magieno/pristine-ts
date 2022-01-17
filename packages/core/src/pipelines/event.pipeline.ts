import {injectable, DependencyContainer, injectAll, inject} from "tsyringe";
import {ExecutionContextInterface} from "../interfaces/execution-context.interface";
import {EventInterceptorInterface} from "../interfaces/event-interceptor.interface";
import {EventMapperInterface} from "../interfaces/event-mapper.interface";
import {Event} from "../models/event";
import {LogHandlerInterface} from "@pristine-ts/logging";
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

@injectable()
export class EventPipeline {

    public constructor(
        @injectAll(ServiceDefinitionTagEnum.EventInterceptor) private readonly eventInterceptors: EventInterceptorInterface[],
        @injectAll(ServiceDefinitionTagEnum.EventMapper) private readonly eventMappers: EventMapperInterface<any, any>[],
        @inject('LogHandlerInterface') private readonly logHandler: LogHandlerInterface,
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

        for (const eventInterceptor of this.eventInterceptors) {
            try {
                interceptedEvent = await eventInterceptor.preMappingIntercept?.(interceptedEvent, executionContext) ?? interceptedEvent;
            } catch (error) {
                throw new EventPreMappingInterceptionError("There was an error while executing the PreMapping Event interceptors", error, eventInterceptor.constructor.name, event, executionContext);
            }
        }

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

        for (const eventInterceptor of this.eventInterceptors) {
            try {
                interceptedEvent = await eventInterceptor.postMappingIntercept?.(interceptedEvent) ?? interceptedEvent;
            } catch (error) {
                throw new EventPostMappingInterceptionError("There was an error while executing the PostMapping Event interceptors", error, eventInterceptor.constructor.name, event);
            }
        }

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

        for (const eventInterceptor of this.eventInterceptors) {
            try {
                interceptedEventResponse = await eventInterceptor.preResponseMappingIntercept?.(interceptedEventResponse) ?? interceptedEventResponse;
            } catch (error) {
                throw new EventPreResponseMappingInterceptionError("There was an error while executing the PreResponseMapping Event interceptors", error, eventInterceptor.constructor.name, eventResponse);
            }
        }

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

        for (const eventInterceptor of this.eventInterceptors) {
            try {
                interceptedEventResponse = await eventInterceptor.postResponseMappingIntercept?.(interceptedEventResponse) ?? interceptedEventResponse;
            } catch (error) {
                throw new EventPostResponseMappingInterceptionError("There was an error while executing the PostResponseMapping Event interceptors", error, eventInterceptor.constructor.name, eventResponse);
            }
        }

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
        let interceptedEvent = await this.postMappingIntercept(event)

        try {
            // 2 - Call the EventDispatcher and retrieve the Event Response
            const response = await eventDispatcher.dispatch(interceptedEvent);

            return response;
        } catch (error) {
            throw new EventDispatchingError("There was an error while dispatching the event", error, interceptedEvent);
        }
    }

    /**
     *
     * @param event
     * @param executionContext
     * @param container
     */
    async execute(event: object, executionContext: ExecutionContextInterface<any>, container: DependencyContainer): Promise<any> {
        // 1- We have the raw event, we start by executing the PreMapping Interceptors
        const interceptedEvent = await this.preMappingIntercept(event, executionContext);

        // 2- With the intercepted raw event, run the Events Mapping to get all the Events and the EventsExecutionOptions.
        // For each event mapper that supports the event, we batch the executions for each mapper. So it's possible to execute the same
        // event twice. This is up to the EventMappers to properly identify when they map or don't map an event. Pristine
        // isn't responsible to determine if two events are executed twice, so be careful.

        const eventExecutions: EventsExecutionOptionsInterface<any>[] = [];

        let numberOfEventMappers = 0;

        try {
            this.eventMappers.forEach(eventMapper => {
                if (eventMapper.supportsMapping(interceptedEvent, executionContext)) {
                    eventExecutions.push(eventMapper.map(interceptedEvent, executionContext));
                    numberOfEventMappers++;
                }
            })
        } catch (error) {
            throw new EventMappingError("There was an error mapping the event into an Event object", event, interceptedEvent, executionContext, error)
        }


        if (numberOfEventMappers === 0) {
            throw new EventMappingError("There are no Event Mappers that support the event", event, interceptedEvent, executionContext);
        }


        if (eventExecutions.length === 0 || eventExecutions.reduce((agg, eventExecution) => {
            return agg + eventExecution.events.length;
        }, 0) === 0) {
            throw new EventMappingError("There are no events to execute.", event, interceptedEvent, executionContext)
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
                            const childContainer = container.createChildContainer() as DependencyContainer;

                            // It's important to register the CurrentChildContainer since even though it's not 100% recommended,
                            // some handlers might want to retrieve the container. For example, the RequestHandler needs this mechanism
                            // to dynamically load the controllers and not load all the containers all the time.
                            childContainer.register(ServiceDefinitionTagEnum.CurrentChildContainer, {
                                useValue: childContainer,
                            });

                            const eventDispatcher = childContainer.resolve("EventDispatcherInterface") as EventDispatcherInterface;

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
                            const childContainer = container.createChildContainer();

                            // It's important to register the CurrentChildContainer since even though it's not 100% recommended,
                            // some handlers might want to retrieve the container. For example, the RequestHandler needs this mechanism
                            // to dynamically load the controllers and not load all the containers all the time.
                            childContainer.register(ServiceDefinitionTagEnum.CurrentChildContainer, {
                                useValue: childContainer,
                            });

                            const eventDispatcher = childContainer.resolve("EventDispatcherInterface") as EventDispatcherInterface;

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
        return this.postResponseMappingIntercept(finalResponse);
    }
}
