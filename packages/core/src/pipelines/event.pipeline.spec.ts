import "reflect-metadata"
import {EventPipeline} from "./event.pipeline";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {EventMappingError} from "../errors/event-mapping.error";
import {ExecutionContextKeynameEnum} from "../enums/execution-context-keyname.enum";
import {DependencyContainer} from "tsyringe";
import {DependencyContainerMock} from "../../../../tests/mocks/dependency.container.mock";
import {LogHandlerMock} from "../../../../tests/mocks/log.handler.mock";
import {EventDispatcherMock} from "../../../../tests/mocks/event.dispatcher.mock";
import {EventResponse} from "../models/event.response";
import {EventMapperInterface} from "../interfaces/event-mapper.interface";
import {ExecutionContextInterface} from "../interfaces/execution-context.interface";
import {EventsExecutionOptionsInterface} from "../interfaces/events-execution-options.interface";
import {EventInterceptorInterface} from "../interfaces/event-interceptor.interface";
import {Event} from "../models/event";


describe("Event Pipeline", () => {
    const dependencyContainerMock = new DependencyContainerMock();
    const logHandlerMock = new LogHandlerMock();

    it('should properly call the preMapping Interceptors and passed the intercepted event to the Event Mappers', async () => {
        const interceptedEvent = {
            "interceptedEvent": true,
        }

        const eventInterceptor: EventInterceptorInterface = {
            preMappingIntercept(event: object, executionContextInterface: ExecutionContextInterface<any>): Promise<object> {
                return Promise.resolve(interceptedEvent);
            }
        }

        const eventMapper: EventMapperInterface<any, any> = {
            supportsMapping(event: object, executionContext: ExecutionContextInterface<any>): boolean {
                expect(event).toBe(interceptedEvent);

                return true;
            },
            map(event: object, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<any> {
                return {
                    executionOrder: "sequential",
                    events: [
                        new Event<any>("", event),
                    ]
                }
            },
            supportsReverseMapping(eventResponse: EventResponse<any, any>, response: object, executionContext: ExecutionContextInterface<any>): boolean {
                return false;
            },
            reverseMap(eventResponse: EventResponse<any, any>, response: object, executionContext: ExecutionContextInterface<any>) {
                return {};
            }
        }

        const eventPipeline = new EventPipeline([
            eventInterceptor
        ], [
            eventMapper,
        ], logHandlerMock);

        // @ts-ignore
        dependencyContainerMock.resolve = (token) => {
            if(token === "EventDispatcherInterface") {
                return new EventDispatcherMock(new EventResponse<any, any>(new Event<any>("", {}), {}));
            }
        }

        const event = {};
        const executionContext = {
            keyname: ExecutionContextKeynameEnum.AwsLambda,
            context: {},
        };

        await eventPipeline.execute(event, executionContext, dependencyContainerMock);

        expect.assertions(1)
    });

    it('should properly call the postMapping Interceptors after the Event Parsers are called and before the Event Dispatcher is being called', async () => {
        const interceptedEvent = {
            "interceptedEvent": true,
        }

        let interceptorsCalledOrder = 0;

        const eventInterceptor: EventInterceptorInterface = {
            preMappingIntercept(event: object, executionContextInterface: ExecutionContextInterface<any>): Promise<object> {
                interceptorsCalledOrder++;
                expect(interceptorsCalledOrder).toBe(1);

                return Promise.resolve(interceptedEvent);
            },
            postMappingIntercept(event: Event<any>): Promise<Event<any>> {
                interceptorsCalledOrder++;
                expect(interceptorsCalledOrder).toBe(2);

                return Promise.resolve(event);
            }
        }

        const mappedEvent = new Event<any>("", interceptedEvent);

        const eventMapper: EventMapperInterface<any, any> = {
            supportsMapping(event: object, executionContext: ExecutionContextInterface<any>): boolean {
                return true;
            },
            map(event: object, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<any> {
                return {
                    executionOrder: "sequential",
                    events: [
                        mappedEvent
                    ]
                }
            },
            supportsReverseMapping(eventResponse: EventResponse<any, any>, response: object, executionContext: ExecutionContextInterface<any>): boolean {
                return false;
            },
            reverseMap(eventResponse: EventResponse<any, any>, response: object, executionContext: ExecutionContextInterface<any>) {
                return {};
            }
        }

        const eventPipeline = new EventPipeline([
            eventInterceptor
        ], [
            eventMapper,
        ], logHandlerMock);

        // @ts-ignore
        dependencyContainerMock.resolve = (token) => {
            if(token === "EventDispatcherInterface") {
                const eventDispatcher = new EventDispatcherMock(new EventResponse<any, any>(new Event<any>("", {}), {}));

                eventDispatcher.dispatch = (event: Event<any>): Promise<EventResponse<any, any>> => {
                    expect(event).toBe(mappedEvent);

                    return Promise.resolve(new EventResponse<any, any>(new Event<any>("", {}), {}));
                }

                return eventDispatcher;
            }
        }

        const event = {};
        const executionContext = {
            keyname: ExecutionContextKeynameEnum.AwsLambda,
            context: {},
        };

        await eventPipeline.execute(event, executionContext, dependencyContainerMock);

        expect.assertions(3)
    })

    it('should properly call the EventDispatcher in "sequential" order when the event parser returns "sequential".', async () => {
        const interceptedEvent = {
            "interceptedEvent": true,
        }

        const mappedEvent1 = new Event<any>("event1", interceptedEvent);
        const mappedEvent2 = new Event<any>("event2", interceptedEvent);

        const eventMapper: EventMapperInterface<any, any> = {
            supportsMapping(event: object, executionContext: ExecutionContextInterface<any>): boolean {
                return true;
            },
            map(event: object, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<any> {
                return {
                    executionOrder: "sequential",
                    events: [
                        mappedEvent1,
                        mappedEvent2,
                    ]
                }
            },
            supportsReverseMapping(eventResponse: EventResponse<any, any>, response: object, executionContext: ExecutionContextInterface<any>): boolean {
                return false;
            },
            reverseMap(eventResponse: EventResponse<any, any>, response: object, executionContext: ExecutionContextInterface<any>) {
                return {};
            }
        }

        const eventPipeline = new EventPipeline([
        ], [
            eventMapper,
        ], logHandlerMock);

        let executionOrder = 0;

        // @ts-ignore
        dependencyContainerMock.resolve = (token) => {
            if(token === "EventDispatcherInterface") {
                const eventDispatcher = new EventDispatcherMock(new EventResponse<any, any>(new Event<any>("", {}), {}));

                eventDispatcher.dispatch = (event: Event<any>): Promise<EventResponse<any, any>> => {
                    executionOrder++;

                    if(executionOrder === 1) {
                        expect(event.type).toBe("event1")
                    }
                    else if(executionOrder === 2) {
                        expect(event.type).toBe("event2");
                    }

                    return Promise.resolve(new EventResponse<any, any>(new Event<any>("", {}), {}));
                }

                return eventDispatcher;
            }
        }

        const event = {};
        const executionContext = {
            keyname: ExecutionContextKeynameEnum.AwsLambda,
            context: {},
        };

        await eventPipeline.execute(event, executionContext, dependencyContainerMock);

        expect.assertions(2)
    })

    it('should properly call the EventDispatcher in "parallel" order when the event parser returns "parallel".', async () => {
        const interceptedEvent = {
            "interceptedEvent": true,
        }

        const mappedEvent0 = new Event<any>("event0", interceptedEvent);
        const mappedEvent1 = new Event<any>("event1", interceptedEvent);
        const mappedEvent2 = new Event<any>("event2", interceptedEvent);
        const mappedEvent3 = new Event<any>("event3", interceptedEvent);
        const mappedEvent4 = new Event<any>("event4", interceptedEvent);
        const mappedEvent5 = new Event<any>("event5", interceptedEvent);
        const mappedEvent6 = new Event<any>("event6", interceptedEvent);
        const mappedEvent7 = new Event<any>("event7", interceptedEvent);
        const mappedEvent8 = new Event<any>("event8", interceptedEvent);
        const mappedEvent9 = new Event<any>("event9", interceptedEvent);
        const mappedEvent10 = new Event<any>("event10", interceptedEvent);

        const eventMapper: EventMapperInterface<any, any> = {
            supportsMapping(event: object, executionContext: ExecutionContextInterface<any>): boolean {
                return true;
            },
            map(event: object, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<any> {
                return {
                    executionOrder: "parallel",
                    events: [
                        mappedEvent0,
                        mappedEvent1,
                        mappedEvent2,
                        mappedEvent3,
                        mappedEvent4,
                        mappedEvent5,
                        mappedEvent6,
                        mappedEvent7,
                        mappedEvent8,
                        mappedEvent9,
                        mappedEvent10,
                    ]
                }
            },
            supportsReverseMapping(eventResponse: EventResponse<any, any>, response: object, executionContext: ExecutionContextInterface<any>): boolean {
                return false;
            },
            reverseMap(eventResponse: EventResponse<any, any>, response: object, executionContext: ExecutionContextInterface<any>) {
                return {};
            }
        }

        const eventPipeline = new EventPipeline([
        ], [
            eventMapper,
        ], logHandlerMock);

        const executionOrders: Event<any>[] = [];

        let executionOrder = 0;

        // @ts-ignore
        dependencyContainerMock.resolve = (token) => {
            if(token === "EventDispatcherInterface") {
                const eventDispatcher = new EventDispatcherMock(new EventResponse<any, any>(new Event<any>("", {}), {}));

                eventDispatcher.dispatch = async (event: Event<any>): Promise<EventResponse<any, any>> => {
                    executionOrder++;

                    // fyi, there's a possibility for this test to be flaky. This is the best thing I've found yet to try to test this.
                    const executionTimeout =  Math.floor(Math.random() * 1000 + 50 * executionOrder);

                    await new Promise(resolve => setTimeout(resolve, executionTimeout));

                    executionOrders.push(event);

                    return Promise.resolve(new EventResponse<any, any>(new Event<any>("", {}), {}));
                }

                return eventDispatcher;
            }
        }

        const event = {};
        const executionContext = {
            keyname: ExecutionContextKeynameEnum.AwsLambda,
            context: {},
        };

        await eventPipeline.execute(event, executionContext, dependencyContainerMock);

        // Ensure that the execution orders is not in order
        let atLeastOneNotInOrder = false;

        executionOrders.forEach((executionOrder: Event<any>, index) => {
            if(executionOrder.type !== "event" + index) {
                atLeastOneNotInOrder = true;
            }
        })

        expect(atLeastOneNotInOrder).toBeTruthy()
    })

    it("should call the preResponseMapping Interceptors, and pass the intercepted EventResponse to the Event Mappers", async () => {
        const returnedEventResponse = new EventResponse<any, any>(new Event<any>("", {}), {});

        const eventInterceptor: EventInterceptorInterface = {
            preResponseMappingIntercept(eventResponse: EventResponse<any, any>): Promise<EventResponse<any, any>> {
                eventResponse.response.intercepted = true;

                return Promise.resolve(eventResponse);
            }
        }

        const mappedEvent = new Event<any>("", {});

        const eventMapper: EventMapperInterface<any, any> = {
            supportsMapping(event: object, executionContext: ExecutionContextInterface<any>): boolean {
                return true;
            },
            map(event: object, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<any> {
                return {
                    executionOrder: "sequential",
                    events: [
                        mappedEvent
                    ]
                }
            },
            supportsReverseMapping(eventResponse: EventResponse<any, any>, response: object, executionContext: ExecutionContextInterface<any>): boolean {
                expect(eventResponse.response.intercepted).toBeTruthy()
                return false;
            },
            reverseMap(eventResponse: EventResponse<any, any>, response: object, executionContext: ExecutionContextInterface<any>) {
                return {};
            }
        }

        const eventPipeline = new EventPipeline([
            eventInterceptor
        ], [
            eventMapper,
        ], logHandlerMock);

        // @ts-ignore
        dependencyContainerMock.resolve = (token) => {
            if(token === "EventDispatcherInterface") {
                const eventDispatcher = new EventDispatcherMock(new EventResponse<any, any>(new Event<any>("", {}), {}));

                eventDispatcher.dispatch = (event: Event<any>): Promise<EventResponse<any, any>> => {
                    return Promise.resolve(returnedEventResponse);
                }

                return eventDispatcher;
            }
        }

        const event = {};
        const executionContext = {
            keyname: ExecutionContextKeynameEnum.AwsLambda,
            context: {},
        };

        await eventPipeline.execute(event, executionContext, dependencyContainerMock);

        expect.assertions(1)
    })

    it("should call the postResponseMapping Interceptors before returning the final response", async () => {
        const returnedEventResponse = new EventResponse<any, any>(new Event<any>("", {}), {});

        const eventInterceptor: EventInterceptorInterface = {
            postResponseMappingIntercept(eventResponse: object): Promise<object> {
                return Promise.resolve({...eventResponse, interceptedResponse: true});
            }
        }

        const mappedEvent = new Event<any>("", {});

        const eventMapper: EventMapperInterface<any, any> = {
            supportsMapping(event: object, executionContext: ExecutionContextInterface<any>): boolean {
                return true;
            },
            map(event: object, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<any> {
                return {
                    executionOrder: "sequential",
                    events: [
                        mappedEvent
                    ]
                }
            },
            supportsReverseMapping(eventResponse: EventResponse<any, any>, response: object, executionContext: ExecutionContextInterface<any>): boolean {
                return true;
            },
            reverseMap(eventResponse: EventResponse<any, any>, response: object, executionContext: ExecutionContextInterface<any>) {
                return {
                    finalResponse: true,
                };
            }
        }

        const eventPipeline = new EventPipeline([
            eventInterceptor
        ], [
            eventMapper,
        ], logHandlerMock);

        // @ts-ignore
        dependencyContainerMock.resolve = (token) => {
            if(token === "EventDispatcherInterface") {
                const eventDispatcher = new EventDispatcherMock(new EventResponse<any, any>(new Event<any>("", {}), {}));

                eventDispatcher.dispatch = (event: Event<any>): Promise<EventResponse<any, any>> => {
                    return Promise.resolve(returnedEventResponse);
                }

                return eventDispatcher;
            }
        }

        const event = {};
        const executionContext = {
            keyname: ExecutionContextKeynameEnum.AwsLambda,
            context: {},
        };

        const response = await eventPipeline.execute(event, executionContext, dependencyContainerMock);

        expect(response.finalResponse).toBeTruthy()
        expect(response.interceptedResponse).toBeTruthy()
        expect.assertions(2);
    })

    it("should throw an error when no EventParsers support the event", async () => {
        // @ts-ignore
        const eventMapper: EventMapperInterface<any, any> = {
            supportsMapping(event: object, executionContext: ExecutionContextInterface<any>): boolean {
                return false;
            }
        }

        const eventPipeline = new EventPipeline([], [
            eventMapper,
            eventMapper,
        ], logHandlerMock);

        // @ts-ignore
        dependencyContainerMock.resolve = (token) => {
            return undefined;
        }

        const event = {};
        const executionContext = {
            keyname: ExecutionContextKeynameEnum.AwsLambda,
            context: {},
        };

        expect(eventPipeline.execute(event, executionContext, dependencyContainerMock)).rejects.toThrow(new EventMappingError("There are no Event Mappers that support the event",  event, event, executionContext));
    })

    it("should throw an error if there are no events returned by any mappers", async () => {
        const eventPipeline = new EventPipeline([], [], logHandlerMock);

        // @ts-ignore
        dependencyContainerMock.resolve = (token) => {
           return undefined;
        }

        const event = {};
        const executionContext = {
            keyname: ExecutionContextKeynameEnum.AwsLambda,
            context: {},
        };

        expect(eventPipeline.execute(event, executionContext, dependencyContainerMock)).rejects.toThrow(new EventMappingError("There are no Event Mappers that support the event",  event, event, executionContext));
    })

    it("should throw an error if there are no events mapper", async () => {
        const eventPipeline = new EventPipeline([], [], logHandlerMock);

        // @ts-ignore
        dependencyContainerMock.resolve = (token) => {
           return undefined;
        }

        const event = {};
        const executionContext = {
            keyname: ExecutionContextKeynameEnum.AwsLambda,
            context: {},
        };

        expect(eventPipeline.execute(event, executionContext, dependencyContainerMock)).rejects.toThrow(new EventMappingError("There are no Event Mappers that support the event",  event, event, executionContext));
    })

    it("should throw an error if there are no events to execute", async () => {
        // @ts-ignore
        const eventMapper: EventMapperInterface<any, any> = {
            supportsMapping(event: object, executionContext: ExecutionContextInterface<any>): boolean {
                return true;
            },
            map(event: object, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<any> {
                return {
                    executionOrder: "sequential",
                    events: [],
                }
            }
        }

        const eventPipeline = new EventPipeline([], [
            eventMapper,
        ], logHandlerMock);

        // @ts-ignore
        dependencyContainerMock.resolve = (token) => {
            return undefined;
        }

        const event = {};
        const executionContext = {
            keyname: ExecutionContextKeynameEnum.AwsLambda,
            context: {},
        };

        return expect(eventPipeline.execute(event, executionContext, dependencyContainerMock)).rejects.toThrow(new EventMappingError("There are no events to execute.",  event, event, executionContext));
    })
})
