#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
// This file is intentionally CJS `require()` rather than ESM `import`. It runs as the bin
// entry compiled to dist/lib/cjs/bin.js, where (a) the load order matters (reflect-metadata
// MUST initialize before any decorated class is touched) and (b) static `import` cannot be
// reordered around package-loading side effects the way explicit require() calls can.
//
// reflect-metadata must load before any decorated class so the @injectable/@tag decorators
// can record their metadata against the same Reflect.metadata storage tsyringe later reads.
require('reflect-metadata');

// Load the cli via its package name (not a relative require) so this bin and the consumer's
// AppModule both resolve to the same physical copy of every @pristine-ts/cli class. If we
// loaded via `./cli.js` and the consumer's app.module.js loaded via `@pristine-ts/cli`, the
// two halves would each get their own class identities and tsyringe's decorator metadata
// (keyed by class identity) would not be shared — manifesting as "TypeInfo not known for X".
const cli = require('@pristine-ts/cli');

// `bootstrap()` is fully self-contained: it handles its own errors, builds the right
// `EnvironmentManager` from the loaded `pristine.config.ts` (or defaults to production
// when the config itself couldn't load), and returns the exit code. The bin's only job is
// to exit with that code. No `process.env` reads, no extra catch handler — everything
// flows through the kernel's configuration system.
// `bootstrap()` is designed to be total — every throw funnels through `reportFatalError`.
// This `.catch` is a last-resort safety net for the pathological case where the fallback
// reporter itself throws (invalid `pristine.environment` string, reporter constructor
// failure, etc.). Without it, such a throw becomes an unhandled rejection and Node dumps
// the raw stack to stderr, bypassing any sanitization.
cli.bootstrap()
  .then((exitCode: number) => process.exit(exitCode))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
