#!/usr/bin/env node
// reflect-metadata must load before any decorated class so the @injectable/@tag decorators
// can record their metadata against the same Reflect.metadata storage tsyringe later reads.
require('reflect-metadata');
require('./cli.js');