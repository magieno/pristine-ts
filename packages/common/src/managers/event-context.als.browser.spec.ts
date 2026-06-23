import {eventContextStorage} from "./event-context.als.browser";
import {EventContext} from "../contexts/event-context";

const makeContext = (eventId: string): EventContext => ({eventId} as EventContext);

describe("Browser EventContextStorage shim", () => {
  it("exposes the active store synchronously inside run()", () => {
    const ctx = makeContext("a");
    const seen = eventContextStorage.run(ctx, () => eventContextStorage.getStore());
    expect(seen).toBe(ctx);
  });

  it("has no active store outside of run()", () => {
    expect(eventContextStorage.getStore()).toBeUndefined();
  });

  it("restores the previous store after run() returns", () => {
    const outer = makeContext("outer");
    eventContextStorage.run(outer, () => {
      const inner = makeContext("inner");
      eventContextStorage.run(inner, () => {
        expect(eventContextStorage.getStore()).toBe(inner);
      });
      // Nested run() restored the outer context.
      expect(eventContextStorage.getStore()).toBe(outer);
    });
    expect(eventContextStorage.getStore()).toBeUndefined();
  });

  it("restores the previous store even when the callback throws", () => {
    expect(() => eventContextStorage.run(makeContext("boom"), () => {
      throw new Error("boom");
    })).toThrow("boom");
    expect(eventContextStorage.getStore()).toBeUndefined();
  });

  it("returns the callback's return value", () => {
    expect(eventContextStorage.run(makeContext("a"), () => 42)).toBe(42);
  });
});
