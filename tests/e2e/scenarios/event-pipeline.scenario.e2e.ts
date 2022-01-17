
describe("Event Pipeline Scenarios", () => {

    it("should set the ChildContainer into itself under the tag ServiceDefinitionTag.CurrentChildContainer when events are to be executed in sequence", () => {
        // to test this, will ensure that two events have two different instances of a class. To do so, we'll create a
        // class that generates a random uuid and ensures that the same handler hasn't seen the same class twice.
        @injec
        class MustBeUniqueInChildContainer {
            public uniqueId: string = uuidv4();
        }

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

        expect(false).toBeTruthy()

    })

    it("should set the ChildContainer into itself under the tag ServiceDefinitionTag.CurrentChildContainer when events are to be executed in parallel", () => {
        // to test this, will ensure that two events have two different instances of a class. To do so, we'll create a
        // class that generates a random uuid and ensures that the same handler hasn't seen the same class twice.


        expect(false).toBeTruthy()

    })
})