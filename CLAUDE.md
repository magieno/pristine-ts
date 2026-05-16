# CLAUDE.md

Project-level instructions for Claude. Anything here is treated as a hard preference.

## Style: prefer OO over standalone functions

When writing utility code, **default to a class with methods** rather than a file
exporting standalone functions. Stateless helpers go on classes too — using a class as
a namespace is fine; the goal is consistency and discoverability across the codebase.

- Prefer: `class TraceRenderer { renderTree(trace) { ... } }`
- Avoid:  `export function renderTraceAsTree(trace) { ... }`

This applies to `packages/*/src/utils/` and similar utility locations across the
monorepo. Existing standalone-function utilities should be refactored to OO when they
get touched.

When the helper has dependencies (e.g. needs a `LogHandler`), make it `@injectable()` so
it can be resolved through DI like any other service. When it's pure (no dependencies),
either make all methods `static` or accept that callers will `new` it once and reuse —
both are fine, pick whichever reads cleaner per-case.

## Architecture: respect module boundaries

Each module owns its own concepts and shouldn't leak them into other modules' surfaces.
**A consumer that doesn't import the networking module should not encounter `Request`,
even if `Request` happens to live in a more universal package today.** When designing
shared primitives (contexts, managers, helpers), put each concern in the module that
owns it — and let modules layer their own contexts on top rather than piling
everything into one universal blob.

Rule of thumb: if a slot, field, or method only makes sense in the presence of a
specific module, it belongs in that module — even if that means more types and more
managers. One typed manager per module beats one generic manager with a
`Map<string, unknown>` extras escape hatch.

## DI: never call `container.resolve` without a justifying comment

Dependencies go through the **constructor**. Calling `container.resolve(...)` (or
`childContainer.resolve(...)`) from inside a service body is a service-locator
anti-pattern that hides dependencies from the class's signature and turns mocking in
tests from "construct with a fake" into "stub the entire container."

- Prefer: `@inject("FooInterface") private readonly foo: FooInterface` in the constructor.
- For optional dependencies that may or may not be registered: `@injectAll("FooInterface", {isOptional: true}) private readonly foos: FooInterface[]` and call the first one (or all). Tsyringe doesn't ship an `isOptional` variant of `@inject`, but the collection form covers the same need.
- Avoid: `container.resolve("FooInterface")` inside a method body.

**The only acceptable exceptions** — and they require an explicit comment on top
explaining why:

1. **Decorators and free functions** that can't have a constructor. `@traced` and the
   no-arg `runWithSpan` resolve the active container via ALS because they're not
   classes — they have nowhere to receive injection. This is a legitimate use.
2. **Pre-kernel-boot code** that runs before any DI container exists (e.g., the CLI's
   `bootstrap()` hand-wiring). Manual `new` is the answer there, not `resolve`.
3. **Framework-internal code** that needs to peek at "is service X registered in this
   container" — rare and always commented.

If you find yourself reaching for `container.resolve` outside those three cases, stop
and rework the design so the dependency is declared in the constructor. Future-you
writing tests will thank present-you.
