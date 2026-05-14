import "reflect-metadata";
import {Request, HttpMethod, EventContextManager, EventContext} from "@pristine-ts/common";
import {RequestContext} from "../contexts/request-context";
import {RequestContextManager} from "./request-context.manager";

function buildRequest(): Request {
  return new Request(HttpMethod.Get, "/test", "req-1");
}

describe("RequestContextManager", () => {
  const manager = new RequestContextManager();

  describe("basic propagation", () => {
    it("returns undefined outside any run()", () => {
      expect(manager.current()).toBeUndefined();
      expect(manager.request()).toBeUndefined();
      expect(manager.identity()).toBeUndefined();
    });

    it("exposes request / identity / methodNode shortcuts inside run()", () => {
      const ctx = new RequestContext();
      ctx.request = buildRequest();
      ctx.identity = {id: "user-1", claims: {}};

      manager.run(ctx, () => {
        expect(manager.current()).toBe(ctx);
        expect(manager.request()?.url).toBe("/test");
        expect(manager.identity()?.id).toBe("user-1");
      });
    });

    it("clears after run() returns", () => {
      const ctx = new RequestContext();
      ctx.request = buildRequest();
      manager.run(ctx, (): void => undefined);
      expect(manager.current()).toBeUndefined();
    });
  });

  describe("async propagation", () => {
    it("propagates across await", async () => {
      const ctx = new RequestContext();
      ctx.request = buildRequest();
      const result = await manager.run(ctx, async () => {
        await Promise.resolve();
        return manager.request()?.url;
      });
      expect(result).toBe("/test");
    });
  });

  describe("isolation from EventContext", () => {
    it("nests cleanly inside an EventContext — both readable from inner scope", async () => {
      const ecm = new EventContextManager();
      const eventCtx = new EventContext();
      eventCtx.eventId = "evt-outer";

      const reqCtx = new RequestContext();
      reqCtx.request = buildRequest();

      const result = await ecm.run(eventCtx, () => manager.run(reqCtx, () => ({
        eventId: ecm.eventId(),
        requestUrl: manager.request()?.url,
      })));

      expect(result.eventId).toBe("evt-outer");
      expect(result.requestUrl).toBe("/test");
    });

    it("RequestContext is not visible from outside the run, even if EventContext is still active", async () => {
      const ecm = new EventContextManager();
      const eventCtx = new EventContext();
      eventCtx.eventId = "evt";

      await ecm.run(eventCtx, async () => {
        const reqCtx = new RequestContext();
        reqCtx.request = buildRequest();
        manager.run(reqCtx, (): void => undefined);

        // Inside the EventContext, but RequestContext has been torn down.
        expect(ecm.eventId()).toBe("evt");
        expect(manager.current()).toBeUndefined();
      });
    });
  });

  describe("identity slot lifecycle", () => {
    it("can be populated after the run() has started (mirrors how the router writes it after auth)", () => {
      const ctx = new RequestContext();
      ctx.request = buildRequest();

      manager.run(ctx, () => {
        expect(manager.identity()).toBeUndefined();
        // Simulate the router writing the identity post-auth.
        ctx.identity = {id: "user-after-auth", claims: {}};
        expect(manager.identity()?.id).toBe("user-after-auth");
      });
    });
  });

  describe("bind", () => {
    it("captures the current context and restores it on call", () => {
      const ctx = new RequestContext();
      ctx.request = buildRequest();
      const captured = manager.run(ctx, () => manager.bind(() => manager.request()?.url));
      expect(manager.current()).toBeUndefined();
      expect(captured()).toBe("/test");
    });
  });

  describe("static accessors", () => {
    it("static methods see the same store as instance methods", () => {
      const ctx = new RequestContext();
      ctx.request = buildRequest();
      ctx.identity = {id: "u", claims: {}};
      manager.run(ctx, () => {
        expect(RequestContextManager.current()).toBe(ctx);
        expect(RequestContextManager.request()?.url).toBe("/test");
        expect(RequestContextManager.identity()?.id).toBe("u");
      });
      expect(RequestContextManager.current()).toBeUndefined();
    });
  });
});
