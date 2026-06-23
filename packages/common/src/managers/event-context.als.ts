import {AsyncLocalStorage} from "async_hooks";
import {EventContext} from "../contexts/event-context";

/**
 * The slice of `AsyncLocalStorage` that {@link EventContextManager} relies on. Pulling it
 * behind this interface lets the storage backend be swapped per runtime: the Node build uses
 * the real `AsyncLocalStorage` (below), while a browser build substitutes
 * `event-context.als.browser.ts` (via the package's `browser` field), since `async_hooks`
 * is Node-only and would otherwise break browser bundlers.
 */
export interface EventContextStorage {
  run<T>(store: EventContext, callback: () => T): T;
  getStore(): EventContext | undefined;
}

/**
 * Process-wide storage backing the active `EventContext`. A single instance is essential —
 * multiple `AsyncLocalStorage` instances would each track their own propagation chain and
 * contexts wouldn't be visible across them. On Node this propagates the context across
 * `await` boundaries, `Promise.all`, `setImmediate`, and the rest of the async machinery.
 */
export const eventContextStorage: EventContextStorage = new AsyncLocalStorage<EventContext>();
