import "reflect-metadata";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  PristineError,
  PristineErrorCode,
  PristineErrorKind,
  Response,
  UnauthorizedError,
  ValidationError,
} from "@pristine-ts/common";
import {EnvironmentManager, PristineEnvironment} from "@pristine-ts/core";
import {HttpErrorResponder} from "./http-error.responder";
import {NetworkingErrorCode} from "../errors/networking-error-code.enum";

function buildResponder(environment: PristineEnvironment | string): HttpErrorResponder {
  return new HttpErrorResponder(new EnvironmentManager(environment));
}

describe("HttpErrorResponder", () => {
  describe("returned shape", () => {
    it("returns a Response instance (not a plain object)", () => {
      const response = buildResponder(PristineEnvironment.Production).respond(new Error("any"));
      expect(response).toBeInstanceOf(Response);
    });

    it("does not set Response.request (the router sets it after responding)", () => {
      const response = buildResponder(PristineEnvironment.Production).respond(new Error("any"));
      expect(response.request).toBeUndefined();
    });

    it("populates status and body", () => {
      const response = buildResponder(PristineEnvironment.Production).respond(new NotFoundError("missing"));
      expect(response.status).toBe(404);
      expect(response.body).toEqual(expect.objectContaining({code: PristineErrorCode.NotFound, message: "missing"}));
    });
  });

  describe("production mode, system error", () => {
    const responder = () => buildResponder(PristineEnvironment.Production);

    it("replaces the message with 'Internal Server Error' for 500 system errors", () => {
      const raw = new Error("internal token-store failure leaked secret xyz");
      const response = responder().respond(raw);

      expect(response.status).toBe(500);
      expect(response.body.code).toBe(PristineErrorCode.InternalError);
      expect(response.body.message).toBe("Internal Server Error");
    });

    it("uses 'Error' (not 'Internal Server Error') for non-500 system errors", () => {
      const error = new PristineError("upstream timeout leaked internals", {
        kind: PristineErrorKind.SystemError,
        httpStatus: 503,
      });
      const response = responder().respond(error);

      expect(response.status).toBe(503);
      expect(response.body.message).toBe("Error");
    });

    it("omits stack, debugMessage, and cause", () => {
      const response = responder().respond(new Error("anything"));

      expect(response.body.stack).toBeUndefined();
      expect(response.body.debugMessage).toBeUndefined();
      expect(response.body.cause).toBeUndefined();
    });

    it("omits details from system errors even when set", () => {
      const wrapped = new PristineError("system w/ secret details", {
        kind: PristineErrorKind.SystemError,
        details: {internalTraceId: "abc-123"},
      });
      const response = responder().respond(wrapped);

      expect(response.body.details).toBeUndefined();
    });
  });

  describe("production mode, user error", () => {
    const responder = () => buildResponder(PristineEnvironment.Production);

    it("surfaces the user-error message verbatim", () => {
      const response = responder().respond(new BadRequestError("title is required"));

      expect(response.status).toBe(400);
      expect(response.body.code).toBe(PristineErrorCode.BadRequest);
      expect(response.body.message).toBe("title is required");
    });

    it("surfaces details for user errors", () => {
      const error = new ValidationError("validation failed", {details: {fields: ["title", "author"]}});
      const response = responder().respond(error);

      expect(response.body.details).toEqual({fields: ["title", "author"]});
    });

    it("uses the carried httpStatus", () => {
      const response = responder().respond(new UnauthorizedError("login required"));
      expect(response.status).toBe(401);
    });

    it("does not include dev-only fields (stack, debugMessage, cause)", () => {
      const response = responder().respond(new ForbiddenError("you can't"));

      expect(response.body.stack).toBeUndefined();
      expect(response.body.debugMessage).toBeUndefined();
      expect(response.body.cause).toBeUndefined();
    });
  });

  describe("development mode", () => {
    const responder = () => buildResponder(PristineEnvironment.Development);

    it("surfaces the original message and debugMessage for system errors", () => {
      const response = responder().respond(new Error("redis client refused connection"));

      expect(response.body.message).toBe("redis client refused connection");
      expect(response.body.debugMessage).toBe("redis client refused connection");
    });

    it("includes the stack for system errors", () => {
      const response = responder().respond(new Error("with stack"));
      expect(typeof response.body.stack).toBe("string");
      expect((response.body.stack as string).length).toBeGreaterThan(0);
    });

    it("walks the Error.cause chain", () => {
      const root = new Error("original root cause");
      const wrapped = new Error("middle layer", {cause: root});
      const outer = new Error("outer", {cause: wrapped});

      const response = responder().respond(outer);

      // `PristineError.from` wraps any non-PristineError as the new top-level error with
      // the original placed in its `cause` slot. So the chain we walk goes:
      //   wrapper.cause === outer → outer.cause === wrapped → wrapped.cause === root
      const chain = response.body.cause as Array<{name: string; message: string}>;
      expect(Array.isArray(chain)).toBe(true);
      expect(chain.length).toBeGreaterThanOrEqual(3);
      expect(chain[0].message).toBe("outer");
      expect(chain[1].message).toBe("middle layer");
      expect(chain[2].message).toBe("original root cause");
    });

    it("caps the cause chain at 10 levels to avoid runaway walks", () => {
      // Build an 11-deep chain. The walker should stop at depth 10.
      let current: Error = new Error("root");
      for (let i = 0; i < 11; i++) {
        current = new Error(`level-${i}`, {cause: current});
      }
      const response = responder().respond(current);

      const chain = response.body.cause as Array<unknown>;
      expect(chain.length).toBeLessThanOrEqual(10);
    });

    it("surfaces details for system errors (production hides them)", () => {
      const wrapped = new PristineError("system w/ details", {
        kind: PristineErrorKind.SystemError,
        details: {field: "title"},
      });
      const response = responder().respond(wrapped);

      expect(response.body.details).toEqual({field: "title"});
    });

    it("surfaces details for user errors too", () => {
      const response = responder().respond(new ValidationError("v", {details: {field: "x"}}));
      expect(response.body.details).toEqual({field: "x"});
    });
  });

  describe("non-Error throws", () => {
    const responder = () => buildResponder(PristineEnvironment.Production);

    it("normalizes a string throw via PristineError.from", () => {
      // PristineError.from treats raw throws as SystemError → production sanitizes.
      const response = responder().respond("string thrown" as any);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Internal Server Error");
    });

    it("normalizes a thrown plain object", () => {
      const response = responder().respond({foo: "bar"} as any);

      expect(response.status).toBe(500);
      expect(response.body.code).toBe(PristineErrorCode.InternalError);
    });

    it("normalizes undefined", () => {
      const response = responder().respond(undefined);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Internal Server Error");
    });
  });

  describe("custom error code from a non-framework error class", () => {
    it("echoes a consumer-defined string code in the response body", () => {
      const error = new BadRequestError("token expired", {code: NetworkingErrorCode.InvalidBody});
      const response = buildResponder(PristineEnvironment.Production).respond(error);

      expect(response.body.code).toBe(NetworkingErrorCode.InvalidBody);
    });
  });

  describe("custom environment strings (not in PristineEnvironment enum)", () => {
    it("treats unknown environments as production (only 'dev' triggers verbose output)", () => {
      const response = buildResponder("staging").respond(new Error("anything"));

      expect(response.body.message).toBe("Internal Server Error");
      expect(response.body.stack).toBeUndefined();
      expect(response.body.debugMessage).toBeUndefined();
    });
  });
});
