import "reflect-metadata"
import {container, singleton} from "tsyringe";
import {CoreModule, ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {controller, NetworkingModule, responseHeader, route} from "@pristine-ts/networking";
import {AppModuleInterface, HttpMethod, Request, Response} from "@pristine-ts/common";

@controller("/api")
@singleton()
@responseHeader("header1", "value1")
class TestController {

    @responseHeader("Cache-Control", "no-cache")
    @route(HttpMethod.Get, "/test")
    public list() {
        return "test"
    }

    @responseHeader("Content-Type", "text/plain")
    @route(HttpMethod.Get, "/textPlain")
    public textPlain() {
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

    it("should intercept the response and augment it with the specified header and the default content type", async () => {

        const kernel = new Kernel();
        await kernel.start(moduleTest, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
            "pristine.networking.defaultContentTypeResponseHeader.isActive": true,
        });

        const request: Request = new Request(HttpMethod.Get, "https://localhost:8080/api/test", "uuid");

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response instanceof Response).toBeTruthy();
        expect(response.status).toBe(200);
        expect(response.body).toEqual("test");
        expect(response.headers).toEqual({"header1": "value1", "content-type": "application/json", "cache-control": "no-cache"});
    })

    it("should intercept the response and augment it with the specified header without the default content type", async () => {

        const kernel = new Kernel();
        await kernel.start(moduleTest, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
            "pristine.networking.defaultContentTypeResponseHeader.isActive": false,
        });

        const request: Request = new Request(HttpMethod.Get, "https://localhost:8080/api/test", "uuid");

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response instanceof Response).toBeTruthy();
        expect(response.status).toBe(200);
        expect(response.body).toEqual("test");
        expect(response.headers).toEqual({"header1": "value1", "cache-control": "no-cache"});
    })

    it("should intercept the response and augment it with the specified header without overwriting the content type with the default one.", async () => {

        const kernel = new Kernel();
        await kernel.start(moduleTest, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
            "pristine.networking.defaultContentTypeResponseHeader.isActive": true,
        });

        const request: Request = new Request(HttpMethod.Get, "https://localhost:8080/api/textPlain", "uuid");

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response instanceof Response).toBeTruthy();
        expect(response.status).toBe(200);
        expect(response.body).toEqual("test");
        expect(response.headers).toEqual({"header1": "value1", "content-type": "text/plain"});
    })
});
