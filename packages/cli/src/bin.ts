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
require('@pristine-ts/cli').bootstrap();