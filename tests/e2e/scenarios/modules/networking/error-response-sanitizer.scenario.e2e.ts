import {
    Controller,
    Get,
    Request,
    Response,
    HttpMethod,
    Route,
    RequestInterface,
    ResponseInterface
} from "@pristine-ts/networking";
import { AppModule, Kernel } from "@pristine-ts/core";
import { inject, injectable } from "tsyringe";

@Controller("/api/2.0")
@injectable()
export class TestController {
    @Get("/error")
    public error(): Response {
        const response = new Response();
        try {
            throw new Error("This is a test error");
        } catch (e) {
            response.status = 500;
            response.body = {
                message: e.message,
                stack: e.stack,
            };

            return response;
        }
    }
}

@AppModule({
    importServices: [TestController],
})
export class TestModule {}

describe("Networking - Error Response Sanitizer", () => {
    it("should remove the stack trace from the error response", async () => {
        const kernel = new Kernel();
        await kernel.start(TestModule, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const request: RequestInterface = new Request(HttpMethod.Get, "/api/2.0/error");
        const response: ResponseInterface = await kernel.handle(request);

        expect(response.status).toBe(500);
        expect(response.body).toBeDefined();
        expect(response.body.message).toBe("This is a test error");
        expect(response.body.stack).toBeUndefined();
    });

    it("should not remove the stack trace from the error response when the sanitizer is deactivated", async () => {
        const kernel = new Kernel();
        await kernel.start(TestModule, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
            "pristine.networking.error_response_sanitizer.is_active": false,
        });

        const request: RequestInterface = new Request(HttpMethod.Get, "/api/2.0/error");
        const response: ResponseInterface = await kernel.handle(request);

        expect(response.status).toBe(500);
        expect(response.body).toBeDefined();
        expect(response.body.message).toBe("This is a test error");
        expect(response.body.stack).toBeDefined();
    });
});
