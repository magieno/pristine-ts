import {controller, NetworkingModule, route} from "@pristine-ts/networking";
import {HttpMethod, Request, Response} from "@pristine-ts/common";
import {ValidationModule} from "@pristine-ts/validation";
import {CoreModule, ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {injectable} from "tsyringe";

describe("Request Body Converter", () => {

    @controller("/test")
    @injectable()
    class TestController {
        @route(HttpMethod.Get, "/")
        public list() {
            return {
                response: true,
            }
        }
    }


     let kernel: Kernel;

    beforeAll(async () => {
        kernel = new Kernel();

        await kernel.start({
            keyname: "pristine.validation.test",
            importModules: [CoreModule, NetworkingModule, ValidationModule],
            providerRegistrations: [],
            importServices: [],
        }, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });
    })

    it("should throw an error if the header Content-Type contains 'application/json' and the body contains invalid JSON.", async () => {
        const request: Request = new Request(HttpMethod.Get, "http://localhost:8080/test");
        request.body = "{allo:fdfsa,}";
        request.setHeaders({
            "Content-Type": "application/json",
        });

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response instanceof Response).toBeTruthy();
        expect(response.status).toBe(400)
        expect(response.body.message).toBe("RequestBodyConverterInterceptor: This request has the Content-Type header 'application/json', and the body is of type string, but the body contains invalid JSON.")
    })

    it("should not throw an error if the header Content-Type contains 'application/json'', and the body is of type string, and the body contains valid JSON.", async () => {

        let request = new Request(HttpMethod.Get, "http://localhost:8080/test")
        request.setHeaders({
            "Content-Type": "application/json",
        });

        request.body = "{\"allo\":2}";
        expect(((await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}})) as Response).status).toBe(200);

        request.body = "";
        expect(((await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}})) as Response).status).toBe(200);

        request.body = "{}";
        expect(((await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}})) as Response).status).toBe(200);
    })

    it("should not throw an error when the header Content-Type contains 'application/json' and the body contains invalid JSON if the request body converter is deactivated", async () => {
        await kernel.start({
            keyname: "pristine.validation.test",
            importModules: [CoreModule, NetworkingModule, ValidationModule],
            providerRegistrations: [],
            importServices: [],
        }, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
            "pristine.core.requestBodyConverterActive": true,
        });

        const request: Request = new Request(HttpMethod.Get, "http://localhost:8080/test");
        request.body = "{allo:fdfsa,}";

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response instanceof Response).toBeTruthy()
        expect(response.status).toBe(200)
    })
});
