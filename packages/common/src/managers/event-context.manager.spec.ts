import "reflect-metadata";
import {EventContext} from "../contexts/event-context";
import {EventContextManager} from "./event-context.manager";

function buildContext(eventId: string): EventContext {
  const ctx = new EventContext();
  ctx.eventId = eventId;
  return ctx;
}

describe("EventContextManager", () => {
  const manager = new EventContextManager();

  describe("basic propagation", () => {
    it("returns undefined outside any run()", () => {
      expect(manager.current()).toBeUndefined();
      expect(manager.eventId()).toBeUndefined();
      expect(manager.traceId()).toBeUndefined();
      expect(manager.container()).toBeUndefined();
    });

    it("exposes the active context inside run()", () => {
      const ctx = buildContext("evt-1");
      const seen = manager.run(ctx, () => manager.current());
      expect(seen).toBe(ctx);
    });

    it("exposes eventId / traceId / container shortcuts", () => {
      const ctx = buildContext("evt-2");
      ctx.traceId = "trace-2";
      // container is left undefined for this test.
      manager.run(ctx, () => {
        expect(manager.eventId()).toBe("evt-2");
        expect(manager.traceId()).toBe("trace-2");
        expect(manager.container()).toBeUndefined();
      });
    });

    it("clears the context after run() returns", () => {
      manager.run(buildContext("evt-3"), (): void => undefined);
      expect(manager.current()).toBeUndefined();
    });
  });

  describe("async propagation", () => {
    it("propagates across await", async () => {
      const ctx = buildContext("evt-await");
      const result = await manager.run(ctx, async () => {
        await Promise.resolve();
        return manager.eventId();
      });
      expect(result).toBe("evt-await");
    });

    it("propagates across multiple awaits + microtasks", async () => {
      const ctx = buildContext("evt-multi");
      const result = await manager.run(ctx, async () => {
        await Promise.resolve();
        await Promise.resolve();
        await new Promise(r => queueMicrotask(() => r(undefined)));
        return manager.eventId();
      });
      expect(result).toBe("evt-multi");
    });

    it("propagates across setImmediate", async () => {
      const ctx = buildContext("evt-imm");
      const result = await manager.run(ctx, () => new Promise<string | undefined>((resolve) => {
        setImmediate(() => resolve(manager.eventId()));
      }));
      expect(result).toBe("evt-imm");
    });

    it("propagates across setTimeout", async () => {
      const ctx = buildContext("evt-timeout");
      const result = await manager.run(ctx, () => new Promise<string | undefined>((resolve) => {
        setTimeout(() => resolve(manager.eventId()), 1);
      }));
      expect(result).toBe("evt-timeout");
    });
  });

  describe("isolation", () => {
    it("concurrent run() calls each see their own context", async () => {
      const start = (eventId: string, delayMs: number) => manager.run(buildContext(eventId), async () => {
        await new Promise(r => setTimeout(r, delayMs));
        return manager.eventId();
      });

      // Kick off two events back-to-back; the slower one resolves later but should
      // still see its own eventId, not the faster one's.
      const [a, b] = await Promise.all([start("evt-a", 10), start("evt-b", 5)]);
      expect(a).toBe("evt-a");
      expect(b).toBe("evt-b");
    });

    it("nested run() shadows the outer context for the duration of the inner", () => {
      const outer = buildContext("evt-outer");
      const inner = buildContext("evt-inner");
      manager.run(outer, () => {
        expect(manager.eventId()).toBe("evt-outer");
        manager.run(inner, () => {
          expect(manager.eventId()).toBe("evt-inner");
        });
        // Restored after inner returns.
        expect(manager.eventId()).toBe("evt-outer");
      });
    });
  });

  describe("bind", () => {
    it("captures the current context and restores it on call", () => {
      const ctx = buildContext("evt-bound");
      const captured = manager.run(ctx, () => manager.bind(() => manager.eventId()));
      // The original context has been torn down here, but the bound function should
      // still see "evt-bound" because bind captured it.
      expect(manager.eventId()).toBeUndefined();
      expect(captured()).toBe("evt-bound");
    });

    it("returns the function unchanged when no context is active", () => {
      const fn = () => "passthrough";
      const bound = manager.bind(fn);
      expect(bound).toBe(fn);
    });

    it("captured context survives across an async boundary", async () => {
      const ctx = buildContext("evt-async-bound");
      const bound = manager.run(ctx, () => manager.bind(async () => {
        await Promise.resolve();
        return manager.eventId();
      }));
      expect(await bound()).toBe("evt-async-bound");
    });
  });

  describe("static accessors", () => {
    it("static methods see the same store as instance methods", () => {
      const ctx = buildContext("evt-static");
      manager.run(ctx, () => {
        expect(EventContextManager.current()).toBe(ctx);
        expect(EventContextManager.eventId()).toBe("evt-static");
      });
      expect(EventContextManager.current()).toBeUndefined();
    });

    it("static bind works the same as instance bind", () => {
      const ctx = buildContext("evt-static-bound");
      const captured = manager.run(ctx, () => EventContextManager.bind(() => EventContextManager.eventId()));
      expect(captured()).toBe("evt-static-bound");
    });
  });

  describe("return-value handling", () => {
    it("propagates the synchronous return value of fn", () => {
      const result = manager.run(buildContext("evt-sync"), () => 42);
      expect(result).toBe(42);
    });

    it("propagates the async return value of fn", async () => {
      const result = await manager.run(buildContext("evt-async"), async () => 84);
      expect(result).toBe(84);
    });

    it("propagates thrown errors out of run()", () => {
      const error = new Error("inner-throw");
      expect(() => manager.run(buildContext("evt-throw"), () => { throw error; })).toThrow(error);
    });
  });
});
