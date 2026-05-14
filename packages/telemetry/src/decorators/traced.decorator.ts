import {spanRunner} from "../utils/span-runner";

/**
 * Method decorator that wraps the decorated method in a span. The span is automatically
 * ended when the method returns or throws, and the `TracingManager` is auto-resolved
 * from the active `EventContext` — no need to inject it manually.
 *
 * ```ts
 * class PaymentService {
 *   @traced()                                // span name = "PaymentService.charge"
 *   async charge(amount: number) { ... }
 *
 *   @traced("payment.refund.action")         // explicit name
 *   async refund(chargeId: string) { ... }
 * }
 * ```
 *
 * **Behavior outside an event context.** When the decorated method runs without an
 * active `EventContext` (e.g. a unit test calling the method directly, or background
 * work that escaped the event lifecycle), the decorator is a no-op — the original
 * method runs unchanged. Tracing must never throw or alter semantics.
 *
 * **Sync methods become async.** The decorator awaits the wrapped method internally,
 * so any decorated method returns a `Promise`. Decorating a sync method changes its
 * signature visible to callers — apply `@traced` to methods you'd already be awaiting
 * (DB calls, HTTP, expensive computations), not to tight sync helpers.
 *
 * **Type-level caveat.** TypeScript's parameter and method decorator types don't carry
 * enough information for the compiler to verify that the wrapped method's return type
 * is compatible with `Promise<T>`. The wrapper is type-safe at runtime; the call site's
 * static types are unchanged. Pair with explicit `: Promise<T>` annotations on the
 * method when you want the static type to match what's actually returned.
 *
 * @param spanName Optional explicit name for the span. Defaults to
 *   `${ClassName}.${methodName}`.
 */
export function traced(spanName?: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    if (typeof original !== "function") {
      // Decorator was applied to something other than a method (a getter, a property
      // with no initial value, etc.). Leave it alone — silently no-op rather than
      // throw at decoration time.
      return descriptor;
    }

    // Resolve a stable default name at decoration time. `target.constructor.name` is
    // the class name for instance methods; for static methods, `target.name` is the
    // class. We cover both via the fallback chain.
    const className: string = target?.constructor?.name ?? target?.name ?? "anonymous";
    const resolvedName = spanName ?? `${className}.${String(propertyKey)}`;

    descriptor.value = function (this: unknown, ...args: any[]) {
      return spanRunner.runWithSpan(resolvedName, () => original.apply(this, args));
    };

    return descriptor;
  };
}
