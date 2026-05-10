#!/usr/bin/env node
// reflect-metadata must load before any decorated class so the @injectable/@tag decorators
// can record their metadata against the same Reflect.metadata storage tsyringe later reads.
require('reflect-metadata');

// Load the cli via its package name (not a relative require) so this bin and the consumer's
// AppModule both resolve to the same physical copy of every @pristine-ts/cli class. If we
// loaded via `./cli.js` and the consumer's app.module.js loaded via `@pristine-ts/cli`, the
// two halves would each get their own class identities and tsyringe's decorator metadata
// (keyed by class identity) would not be shared — manifesting as "TypeInfo not known for X".
require('@pristine-ts/cli').bootstrap();