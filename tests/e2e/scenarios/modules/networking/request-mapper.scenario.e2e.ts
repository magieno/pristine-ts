import {controller, NetworkingModule, RequestMapper, responseHeader, route} from "@pristine-ts/networking";
import {AppModuleInterface, HttpMethod, Request, Response, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {
    CoreModule,
    EventResponse,
    EventsExecutionOptionsInterface,
    ExecutionContextKeynameEnum,
    Kernel
} from "@pristine-ts/core";
import {container, singleton} from "tsyringe";
import Spy = jasmine.Spy;

@controller("/api")
@singleton()
class TestController {

    @route(HttpMethod.Get, "/test")
    public list() {
        return "test"
    }
}

const moduleTest: AppModuleInterface = {
    importServices: [],
    keyname: "Module",
    importModules: [
        CoreModule,
        NetworkingModule,
    ]
}

describe("Request Mapper scenarios", () => {
    beforeEach(async () => {
        // Very import to clear the instances in between executions.
        container.clearInstances();
    })


    it("should call the 'supports' and 'map' method of the Request Mapper", async () => {
        const kernel = new Kernel();
        await kernel.start(moduleTest, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const request: Request = new Request(HttpMethod.Get, "https://localhost:8080/api/test", "uuid");

        let requestMapperSupportsSpy;
        let requestMapperMapSpy;

        kernel.container.afterResolution(ServiceDefinitionTagEnum.EventMapper, (token, result, resolutionType) => {
            // todo, verify that RequestMapper is in array
            expect(Array.isArray(result)).toBeTruthy()

            const requestMapper: RequestMapper = (result as any[]).find(elem => elem instanceof RequestMapper);

            expect(requestMapper).toBeDefined()

            // Add a spy on the supports method of the RequestMapper.
            requestMapperSupportsSpy = jest.spyOn(requestMapper, "supportsMapping");
            requestMapperMapSpy = jest.spyOn(requestMapper, "map");
        }, {frequency: "Always"});

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response instanceof Response).toBeTruthy();
        expect(response.status).toBe(200);
        expect(response.body).toEqual("test");

        // To test this scenario, we will ensure that
        expect(requestMapperSupportsSpy).toBeDefined()
        expect(requestMapperSupportsSpy).toHaveBeenCalled()
        // @ts-ignore
        expect(requestMapperSupportsSpy.mock.results[0].value).toBeTruthy()

        expect(requestMapperMapSpy).toBeDefined()
        expect(requestMapperMapSpy).toHaveBeenCalled()

        // @ts-ignore
        const execution: EventsExecutionOptionsInterface<any> = requestMapperMapSpy.mock.results[0].value;

        expect(execution.executionOrder).toBe("sequential")
        expect(execution.events.length).toBe(1)
        expect(execution.events[0].type).toBe("Request")
        expect(execution.events[0].payload).toBe(request)
    })

    it("should call the 'supportsReverseMapping' and 'reverseMapping' method of the Request Mapper", async () => {
        const kernel = new Kernel();
        await kernel.start(moduleTest, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const request: Request = new Request(HttpMethod.Get, "https://localhost:8080/api/test", "uuid");

        let requestMapperSupportsReverseMappingSpy;
        let requestMapperReverseMapSpy;

        kernel.container.afterResolution(ServiceDefinitionTagEnum.EventMapper, (token, result, resolutionType) => {
            // todo, verify that RequestMapper is in array
            expect(Array.isArray(result)).toBeTruthy()

            const requestMapper: RequestMapper = (result as any[]).find(elem => elem instanceof RequestMapper);

            expect(requestMapper).toBeDefined()

            // Add a spy on the supports method of the RequestMapper.
            requestMapperSupportsReverseMappingSpy = jest.spyOn(requestMapper, "supportsReverseMapping");
            requestMapperReverseMapSpy = jest.spyOn(requestMapper, "reverseMap");
        }, {frequency: "Always"});

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response instanceof Response).toBeTruthy();
        expect(response.status).toBe(200);
        expect(response.body).toEqual("test");

        // To test this scenario, we will ensure that
        expect(requestMapperSupportsReverseMappingSpy).toBeDefined()
        expect(requestMapperSupportsReverseMappingSpy).toHaveBeenCalled()
        // @ts-ignore
        expect(requestMapperSupportsReverseMappingSpy.mock.results[0].value).toBeTruthy()

        expect(requestMapperReverseMapSpy).toBeDefined()
        expect(requestMapperReverseMapSpy).toHaveBeenCalled()

        // @ts-ignore
        expect(requestMapperReverseMapSpy.mock.results[0].value).toBe(response);
    })
})
