import {HttpMethod, Request, Response} from "@pristine-ts/common";
import { inject, injectable } from "tsyringe";
import {controller, NetworkingModule, route} from "@pristine-ts/networking";
import {ValidationModule} from "@pristine-ts/validation";
import {CoreModule, ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";

@controller("/api/2.0")
@injectable()
export class TestController {
  @route(HttpMethod.Get, "/error")
    public error() {
      throw new Error("This is a test error");
    }
}

describe("Networking - Error Response Sanitizer", () => {
    it("should remove the stack trace from the error response", async () => {
        const kernel = new Kernel();
        await kernel.start({
          keyname: "pristine.validation.test",
          importModules: [CoreModule, NetworkingModule, ValidationModule],
          providerRegistrations: [],
          importServices: [],
        }, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const request = new Request(HttpMethod.Get, "/api/2.0/error", "uuid");
        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response.status).toBe(500);
        expect(response.body).toBeDefined();
        expect(response.body.message).toBe("This is a test error");
        expect(response.body.stack).toBeUndefined();
    });

    it("should not remove the stack trace from the error response when the sanitizer is deactivated", async () => {
        const kernel = new Kernel();
        await kernel.start({
          keyname: "pristine.validation.test",
          importModules: [CoreModule, NetworkingModule, ValidationModule],
          providerRegistrations: [],
          importServices: [],
        }, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
            "pristine.networking.error_response_sanitizer.is_active": false,
        });

        const request = new Request(HttpMethod.Get, "/api/2.0/error", "uuid");
        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response.status).toBe(500);
        expect(response.body).toBeDefined();
        expect(response.body.message).toBe("This is a test error");
        expect(response.body.stack).toBeDefined();
    });
});
