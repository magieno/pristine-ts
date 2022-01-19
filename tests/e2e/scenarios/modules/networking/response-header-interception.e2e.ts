import "reflect-metadata"
import {container, singleton} from "tsyringe";
import {CoreModule, ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {controller, NetworkingModule, Response, responseHeader, route} from "@pristine-ts/networking";
import {AppModuleInterface, HttpMethod, RequestInterface} from "@pristine-ts/common";

@controller("/api")
@singleton()
@responseHeader("header1", "value1")
class TestController {

    @responseHeader("Cache-Control", "no-cache")
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

describe("Response header interception", () => {
    beforeEach(async () => {
        // Very import to clear the instances in between executions.
        container.clearInstances();
    })

    it("should intercept the response and augment it with the specified header", async () => {

        const kernel = new Kernel();
        await kernel.start(moduleTest, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const request: RequestInterface = {
            url: "https://localhost:8080/api/test",
            httpMethod: HttpMethod.Get,
            body: {},
        }

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response instanceof Response).toBeTruthy();
        expect(response.status).toBe(200);
        expect(response.body).toEqual("test");
        expect(response.headers).toEqual({"header1": "value1", "Cache-Control": "no-cache"});
    })
});
