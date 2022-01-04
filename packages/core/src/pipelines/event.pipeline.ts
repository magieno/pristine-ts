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

@injectable()
export class EventPipeline {

    public constructor(
        @injectAll(ServiceDefinitionTagEnum.EventInterceptor) private readonly eventInterceptors: EventInterceptorInterface[],
        @injectAll(ServiceDefinitionTagEnum.EventMapper) private readonly eventMappers: EventMapperInterface<any, any>[],
        @inject('LogHandlerInterface') private readonly logHandler: LogHandlerInterface,
        ) {
    }

    private async preMappingIntercept(event: object, executionContext: ExecutionContextInterface<any>): Promise<object> {
        let interceptedEvent = event;

        for (const eventInterceptor of this.eventInterceptors) {
            interceptedEvent = await eventInterceptor.preMappingIntercept?.(interceptedEvent, executionContext) ?? interceptedEvent;
        }

        return interceptedEvent;
    }

    private async postMappingIntercept(event: Event<any>): Promise<Event<any>> {
        let interceptedEvent = event;

        for (const eventInterceptor of this.eventInterceptors) {
            interceptedEvent = await eventInterceptor.postMappingIntercept?.(interceptedEvent) ?? interceptedEvent;
        }

        return interceptedEvent;
    }

    private async preResponseMappingIntercept(eventResponse: EventResponse<any, any>): Promise<EventResponse<any, any>> {
        let interceptedEventResponse = eventResponse;

        for (const eventInterceptor of this.eventInterceptors) {
            interceptedEventResponse = await eventInterceptor.preResponseMappingIntercept?.(interceptedEventResponse) ?? interceptedEventResponse;
        }

        return interceptedEventResponse;
    }

    private async postResponseMappingIntercept(eventResponse: object): Promise<object> {
        let interceptedEventResponse = eventResponse;

        for (const eventInterceptor of this.eventInterceptors) {
            interceptedEventResponse = await eventInterceptor.postResponseMappingIntercept?.(interceptedEventResponse) ?? interceptedEventResponse;
        }

        return interceptedEventResponse;
    }

    private async executeEvent(event: Event<any>, eventDispatcher: EventDispatcherInterface): Promise<EventResponse<any, any>> {
        // 1 - Run the post mapped interceptors on every single event before they get executed.
        let interceptedEvent = await this.postMappingIntercept(event)

        // 2 - Call the EventDispatcher and retrieve the Event Response
        return eventDispatcher.dispatch(interceptedEvent);
    }

    async execute(event: object, executionContext: ExecutionContextInterface<any>, container: DependencyContainer): Promise<any> {
        // 1- We have the raw event, we start by executing the PreMapping Interceptors
        const interceptedEvent = await this.preMappingIntercept(event, executionContext);

        // 2- With the intercepted raw event, run the Events Mapping to get all the Events and the EventsExecutionOptions.
        // For each event mapper that supports the event, we batch the executions for each mapper. So it's possible to execute the same
        // event twice. This is up to the EventMappers to properly identify when they map or don't map an event. Pristine
        // isn't responsible to determine if two events are executed twice, so be careful.

        const eventExecutions: EventsExecutionOptionsInterface<any>[] = [];

        let numberOfEventMappers = 0;

        this.eventMappers.forEach( eventMapper => {
            if(eventMapper.supportsMapping(interceptedEvent, executionContext)) {
                eventExecutions.push(eventMapper.map(interceptedEvent, executionContext));
                numberOfEventMappers++;
            }
        })

        if(numberOfEventMappers === 0) {
            throw new EventMappingError("There are no Event Mappers that support the event", event, interceptedEvent, executionContext);
        }


        if(eventExecutions.length === 0 || eventExecutions.reduce( (agg, eventExecution) => { return agg + eventExecution.events.length;}, 0 ) === 0) {
            throw new EventMappingError("There are no events to execute.", event, interceptedEvent, executionContext)
        }

        const eventsExecutionPromises: Promise<EventResponse<any, any> | EventResponse<any, any>[]>[] = [];

        // 3- Loop over the EventExecutionOptions array and start executing the events
        eventExecutions.forEach(eventExecutionOptions => {
            switch (eventExecutionOptions.executionOrder) {
                case 'sequential':
                    eventsExecutionPromises.push(new Promise<EventResponse<any, any>[]>(async resolve => {
                        // await all events and then resolve.
                        const eventResponses = [];

                        for (const event of eventExecutionOptions.events) {
                            const childContainer = container.createChildContainer();
                            const eventDispatcher = childContainer.resolve("EventDispatcherInterface") as EventDispatcherInterface;

                            eventResponses.push(await this.executeEvent(event, eventDispatcher));
                        }

                        return resolve(eventResponses);
                    }))
                    break;
                case 'parallel':
                    for (const event of eventExecutionOptions.events) {
                        eventsExecutionPromises.push(new Promise<EventResponse<any, any> | EventResponse<any, any>[]>(async resolve => {
                            const childContainer = container.createChildContainer();
                            const eventDispatcher = childContainer.resolve("EventDispatcherInterface") as EventDispatcherInterface;

                            return resolve(this.executeEvent(event, eventDispatcher));
                        }));
                    }
                    break;
            }
        })

        // 4- For each event, call the PreResponseMapping Interceptors
        const eventResponses: EventResponse<any, any>[] = await Promise.all( (await Promise.all(eventsExecutionPromises)).flat().map( async eventResponse => await this.preResponseMappingIntercept(eventResponse)));

        let finalResponse = {};

        // 5 - Construct the final response by calling the events mapper (reverse map method) for each eventResponse;
        // This method updates the response object that will be returned from the kernel.
        eventResponses.forEach(eventResponse => {
            this.eventMappers.forEach( eventMapper => {
                if(eventMapper.supportsReverseMapping(eventResponse, finalResponse, executionContext)) {
                    finalResponse = eventMapper.reverseMap(eventResponse, finalResponse, executionContext);
                }
            })
        })

        // 6 - Call the PostResponseMapping interceptors and return the final intercepted response.
        return this.postResponseMappingIntercept(finalResponse);
    }
}
