import {EventContext} from "../contexts/event-context";
import type {EventContextStorage} from "./event-context.als";

/**
 * Browser substitute for the Node `AsyncLocalStorage`-backed {@link EventContextStorage}.
 * Browsers have no `async_hooks`, so this keeps the active `EventContext` in a single
 * synchronous slot: it correctly scopes — and restores — the context for the synchronous
 * portion of `run()` (including nested `run()` calls), but, unlike Node's
 * `AsyncLocalStorage`, it cannot propagate across `await` boundaries, which no browser API
 * supports.
 */
class SynchronousEventContextStorage implements EventContextStorage {
  private store: EventContext | undefined;

  run<T>(store: EventContext, callback: () => T): T {
    const previous = this.store;
    this.store = store;
    try {
      return callback();
    } finally {
      this.store = previous;
    }
  }

  getStore(): EventContext | undefined {
    return this.store;
  }
}

export const eventContextStorage: EventContextStorage = new SynchronousEventContextStorage();
