import "reflect-metadata"
import {container, singleton} from "tsyringe";
import {CoreModule, Kernel} from "@pristine-ts/core";
import {controller, NetworkingModule, responseHeader, route} from "@pristine-ts/networking";
import {ModuleInterface, RequestInterface, HttpMethod} from "@pristine-ts/common";

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

const moduleTest: ModuleInterface = {
    keyname: "Module",
    importServices: [],
    importModules: [
        CoreModule,
        NetworkingModule,
    ]
}

describe("Response header enricher", () => {
    beforeEach(async () => {
        // Very import to clear the instances in between executions.
        container.clearInstances();
    })

    it("should enrich the response with the specified header", async () => {

        const kernel = new Kernel();
        await kernel.init(moduleTest);

        const request: RequestInterface = {
            url: "https://localhost:8080/api/test",
            httpMethod: HttpMethod.Get,
            body: {},
        }

        const response = await kernel.handleRequest(request);

        expect(response.status).toBe(200);
        expect(response.body).toEqual("test");
        expect(response.headers).toEqual({"header1": "value1", "Cache-Control": "no-cache"});
    })
});
