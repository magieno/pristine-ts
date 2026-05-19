import {HttpMethod, Request, Response} from "@pristine-ts/common";
import {injectable} from "tsyringe";
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
 * now the default behavior in `HttpErrorResponder` and is gated by the global `PRISTINE_MODE`
 * env var (`production` = sanitize, `development` = verbose). This spec verifies the
 * production vs development rendering paths.
 *
 * The throwing controller raises a raw `new Error("...")`. `PristineError.from` normalizes
 * it as `kind: SystemError`, which triggers production-mode sanitization.
 */
describe("Networking - HttpErrorResponder mode-driven sanitization", () => {
    const originalMode = process.env.PRISTINE_MODE;

    afterEach(() => {
        // Restore the env var after each test so the suite stays isolated.
        if (originalMode === undefined) {
            delete process.env.PRISTINE_MODE;
        } else {
            process.env.PRISTINE_MODE = originalMode;
        }
    });

    it("production mode (default) replaces system-error messages with a generic line and omits the stack", async () => {
        delete process.env.PRISTINE_MODE;   // explicit: defaults to production

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
        expect(response.body.code).toBe("INTERNAL_ERROR");
        expect(response.body.message).toBe("Internal Server Error");
        expect(response.body.stack).toBeUndefined();
        expect(response.body.debugMessage).toBeUndefined();
        expect(response.body.cause).toBeUndefined();
    });

    it("development mode surfaces the original message, stack, and cause chain", async () => {
        process.env.PRISTINE_MODE = "development";

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
        // Dev mode: original message and debugMessage both surface verbatim.
        expect(response.body.message).toBe("This is a test error");
        expect(response.body.debugMessage).toBe("This is a test error");
        expect(response.body.stack).toBeDefined();
        // PristineError.from wraps the raw Error as `cause`, so dev mode walks the chain.
        expect(response.body.cause).toBeDefined();
        expect(Array.isArray(response.body.cause)).toBe(true);
    });
});
