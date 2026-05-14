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
