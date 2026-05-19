import "reflect-metadata";
import {HttpMethod, Request, Response} from "@pristine-ts/common";
import {container, injectable} from "tsyringe";
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

/**
 * Post-2.0.0: the `ErrorResponseSanitizerRequestInterceptor` was deleted. Sanitization is
 * now the default behavior in `HttpErrorResponder` and is gated by the `pristine.environment`
 * configuration (`prod` = sanitize, `dev` = verbose). Both tests below pass the environment
 * explicitly via `kernel.start()`'s configuration override — same path any consumer would
 * use from `pristine.config.ts`. No `process.env` reads anywhere; the env var route is
 * exercised separately through `EnvironmentVariableResolver`'s resolver chain.
 *
 * The throwing controller raises a raw `new Error("...")`. `PristineError.from` normalizes
 * it as `kind: SystemError`, which triggers production-mode sanitization.
 */
describe("Networking - HttpErrorResponder environment-driven sanitization", () => {
    beforeEach(() => {
        // Each test boots its own kernel — clear tsyringe's global instance pool so the
        // previous test's resolved config values don't leak into the next kernel's
        // container resolution path.
        container.clearInstances();
    });

    it("production environment replaces system-error messages with a generic line and omits the stack", async () => {
        const kernel = new Kernel();
        await kernel.start({
          keyname: "pristine.validation.test",
          importModules: [CoreModule, NetworkingModule, ValidationModule],
          providerRegistrations: [],
          importServices: [],
        }, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
            "pristine.environment": "prod",
        });

        const request = new Request(HttpMethod.Get, "/api/2.0/error", "uuid");
        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response.status).toBe(500);
        expect(response.body).toBeDefined();
        expect(response.body.code).toBe("INTERNAL_ERROR");
        expect(response.body.message).toBe("Internal Server Error");
        expect(response.body.stack).toBeUndefined();
        expect(response.body.debugMessage).toBeUndefined();
        expect(response.body.cause).toBeUndefined();
    });

    it("development environment surfaces the original message, stack, and cause chain", async () => {
        const kernel = new Kernel();
        await kernel.start({
          keyname: "pristine.validation.test",
          importModules: [CoreModule, NetworkingModule, ValidationModule],
          providerRegistrations: [],
          importServices: [],
        }, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
            "pristine.environment": "dev",
        });

        const request = new Request(HttpMethod.Get, "/api/2.0/error", "uuid");
        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

        expect(response.status).toBe(500);
        expect(response.body).toBeDefined();
        // Dev environment: original message and debugMessage both surface verbatim.
        expect(response.body.message).toBe("This is a test error");
        expect(response.body.debugMessage).toBe("This is a test error");
        expect(response.body.stack).toBeDefined();
        // PristineError.from wraps the raw Error as `cause`, so dev mode walks the chain.
        expect(response.body.cause).toBeDefined();
        expect(Array.isArray(response.body.cause)).toBe(true);
    });
});
