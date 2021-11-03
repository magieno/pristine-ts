import {IsInt, Max, Min} from "class-validator";
import {controller, NetworkingModule, route} from "@pristine-ts/networking";
import {HttpMethod, RequestInterface} from "@pristine-ts/common";
import {bodyValidation, ValidationModule} from "@pristine-ts/validation";
import {CoreModule, Kernel} from "@pristine-ts/core";
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
    })

    it("should throw an error if the header Content-Type contains 'application/json' and the body contains invalid JSON.", async () => {

        await kernel.init({
            keyname: "pristine.validation.test",
            importModules: [CoreModule, NetworkingModule, ValidationModule],
            providerRegistrations: []
        }, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const request: RequestInterface = {
            httpMethod: HttpMethod.Get,
            url: "http://localhost:8080/test",
            body: "{allo:fdfsa,}",
            headers: {
                "Content-Type": "application/json",
            }
        };

        const response = await kernel.handleRequest(request);

        expect(response.status).toBe(400)
        expect(response.body.message).toBe("This request has the Content-Type header 'application/json' but the body contains invalid JSON.")
    })

    it("should not throw an error if the header Content-Type contains 'application/json' and the body contains valid JSON.", async () => {

        await kernel.init({
            keyname: "pristine.validation.test",
            importModules: [CoreModule, NetworkingModule, ValidationModule],
            providerRegistrations: []
        }, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        expect((await kernel.handleRequest({
            httpMethod: HttpMethod.Get,
            url: "http://localhost:8080/test",
            body: "",
            headers: {
                "Content-Type": "application/json",
            }
        })).status).toBe(200);

        expect((await kernel.handleRequest({
            httpMethod: HttpMethod.Get,
            url: "http://localhost:8080/test",
            body: "{}",
            headers: {
                "Content-Type": "application/json",
            }
        })).status).toBe(200);

        expect((await kernel.handleRequest({
            httpMethod: HttpMethod.Get,
            url: "http://localhost:8080/test",
            body: "{\"allo\":2}",
            headers: {
                "Content-Type": "application/json",
            }
        })).status).toBe(200);
    })

    it("should not throw an error when the header Content-Type contains 'application/json' and the body contains invalid JSON if the request body converter is deactivated", async () => {
        await kernel.init({
            keyname: "pristine.validation.test",
            importModules: [CoreModule, NetworkingModule, ValidationModule],
            providerRegistrations: []
        }, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
            "pristine.core.requestBodyConverterActive": true,
        });

        const request: RequestInterface = {
            httpMethod: HttpMethod.Get,
            url: "http://localhost:8080/test",
            body: "{allo:fdfsa,}",
        };

        const response = await kernel.handleRequest(request);

        expect(response.status).toBe(200)
    })
});
