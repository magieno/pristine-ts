import {AsyncLocalStorage} from "async_hooks";
import {injectable} from "tsyringe";
import {IdentityInterface, Request} from "@pristine-ts/common";
import {RequestContext} from "../contexts/request-context";
import {MethodRouterNode} from "../nodes/method-router.node";

/**
 * Owns the `AsyncLocalStorage` instance that propagates the active `RequestContext`
 * across `await` boundaries for HTTP-routed code.
 *
 * Nested inside the framework's `EventContext`: when the router installs a
 * `RequestContext`, the surrounding `EventContext` (`eventId`/`traceId`/`container`)
 * is still active, so application code inside a controller method can read both.
 *
 * Same shape as `EventContextManager` — `run` + read accessors + static convenience
 * mirrors + `bind` for the background-work escape hatch.
 *
 * Application code outside the networking module never sees this manager. Code inside
 * the networking module uses it to look up the active request without threading it
 * through every method parameter.
 */
@injectable()
export class RequestContextManager {
  private static readonly als = new AsyncLocalStorage<RequestContext>();

  run<T>(ctx: RequestContext, fn: () => T): T;
  run<T>(ctx: RequestContext, fn: () => Promise<T>): Promise<T>;
  run<T>(ctx: RequestContext, fn: () => T | Promise<T>): T | Promise<T> {
    return RequestContextManager.als.run(ctx, fn);
  }

  current(): RequestContext | undefined {
    return RequestContextManager.als.getStore();
  }

  request(): Request | undefined {
    return this.current()?.request;
  }

  methodNode(): MethodRouterNode | undefined {
    return this.current()?.methodNode;
  }

  identity(): IdentityInterface | undefined {
    return this.current()?.identity;
  }

  bind<F extends (...args: any[]) => any>(fn: F): F {
    const ctx = this.current();
    if (ctx === undefined) return fn;
    const als = RequestContextManager.als;
    return ((...args: any[]) => als.run(ctx, () => fn(...args))) as F;
  }

  // ── Static convenience mirrors. ────────────────────────────────────────────────

  static current(): RequestContext | undefined {
    return RequestContextManager.als.getStore();
  }

  static request(): Request | undefined {
    return RequestContextManager.current()?.request;
  }

  static methodNode(): MethodRouterNode | undefined {
    return RequestContextManager.current()?.methodNode;
  }

  static identity(): IdentityInterface | undefined {
    return RequestContextManager.current()?.identity;
  }

  static bind<F extends (...args: any[]) => any>(fn: F): F {
    const ctx = RequestContextManager.current();
    if (ctx === undefined) return fn;
    const als = RequestContextManager.als;
    return ((...args: any[]) => als.run(ctx, () => fn(...args))) as F;
  }
}
