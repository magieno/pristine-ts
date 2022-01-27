import "reflect-metadata"
import {injectable, inject, DependencyContainer, container} from "tsyringe";
import {v4 as uuidv4} from "uuid";
import {
    AppModuleInterface,
    ServiceDefinitionTagEnum,
    tag,
    taggedProviderRegistrationsRegistry
} from "@pristine-ts/common";
import {
    CoreModule,
    Event,
    EventHandlerInterface,
    EventMapperInterface,
    EventResponse,
    EventsExecutionOptionsInterface,
    ExecutionContextInterface,
    ExecutionContextKeynameEnum,
    Kernel
} from "@pristine-ts/core";



describe("Event Pipeline Scenarios", () => {
// to test this, will ensure that two events have two different instances of a class. To do so, we'll create a
// class that generates a random uuid and ensures that the same handler hasn't seen the same class twice.
    @injectable()
    class MustBeUniqueInChildContainer {
        public uniqueId: string = uuidv4();
    }

    let seenIds: string[] = [];

    @tag(ServiceDefinitionTagEnum.EventHandler)
    @injectable()
    class EventHandler implements EventHandlerInterface<any, any> {
        constructor(private readonly mustBeUniqueInChildContainer: MustBeUniqueInChildContainer, @inject(ServiceDefinitionTagEnum.CurrentChildContainer) private readonly currentChildContainer: DependencyContainer) {
        }

        handle(event: Event<any>): Promise<EventResponse<any, any>> {
            seenIds.push(this.mustBeUniqueInChildContainer.uniqueId);

            expect(this.currentChildContainer).toBeDefined()

            return Promise.resolve(new EventResponse(event, {}));
        }

        supports<T>(event: Event<T>): boolean {
            return true;
        }

    }

    @tag(ServiceDefinitionTagEnum.EventMapper)
    @injectable()
    class EventMapper implements EventMapperInterface<any, any> {
        constructor() {
        }

        map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<any> {

            return {
                events: [
                    new Event<any>("type", rawEvent),
                    new Event<any>("type", rawEvent),
                ],
                executionOrder: executionContext.context.executionOrder,
            };
        }

        reverseMap(eventResponse: EventResponse<any, any>, response: any, executionContext: ExecutionContextInterface<any>): any {
            return eventResponse;
        }

        supportsMapping(rawEvent: any, executionContext: ExecutionContextInterface<any>): boolean {
            return true;
        }

        supportsReverseMapping(eventResponse: EventResponse<any, any>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
            return false;
        }

    }

    let kernel = new Kernel();

    beforeAll( async () => {
        const appModule: AppModuleInterface = {
            keyname: "test.app",
            importModules: [CoreModule],
            importServices: [],
        }

        await kernel.start(appModule, {
            "pristine.logging.consoleLoggerActivated" : false,
            "pristine.logging.fileLoggerActivated" : false,
        });
    })

    beforeEach(() => {
        seenIds = [];
    })

    it("should set the ChildContainer into itself under the tag ServiceDefinitionTag.CurrentChildContainer when events are to be executed in sequence", async () => {

        await kernel.handle({}, {keyname: ExecutionContextKeynameEnum.Jest, context: {executionOrder: 'sequential'}})

        expect(kernel.container.isRegistered(ServiceDefinitionTagEnum.CurrentChildContainer)).toBeFalsy();

        expect(seenIds.length).toBe(2);
        expect(seenIds[0]).not.toEqual(seenIds[1]);

        expect.assertions(5);
    })

    it("should set the ChildContainer into itself under the tag ServiceDefinitionTag.CurrentChildContainer when events are to be executed in parallel", async () => {

        await kernel.handle({}, {keyname: ExecutionContextKeynameEnum.Jest, context: {executionOrder: 'parallel'}})

        expect(kernel.container.isRegistered(ServiceDefinitionTagEnum.CurrentChildContainer)).toBeFalsy();

        expect(seenIds.length).toBe(2);
        expect(seenIds[0]).not.toEqual(seenIds[1]);

        expect.assertions(5);
    })
})