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
