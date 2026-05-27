# @pristine-ts/data-mapping-common

Framework-agnostic core for [`@pristine-ts/data-mapping`](../data-mapping). No DI container,
no logging dependency — usable directly in Angular / browser bundles.

## What's here

- `DataMapper` — `autoMap`, `map`, `mapAll`
- `AutoDataMappingBuilder` — schema inference from `@property` / `@array` decorators (with a `WeakMap` cache)
- `DataMappingBuilder` — fluent schema construction (`field`, `nested`, `arrayOfObjects`, `arrayOfScalars`)
- Built-in normalizers: `StringNormalizer`, `NumberNormalizer`, `BooleanNormalizer`, `DateNormalizer`, `LowercaseNormalizer`
- `ConsoleErrorReporter` — default error sink that writes to `console.error`

## Standalone usage

```sh
npm install @pristine-ts/data-mapping-common class-transformer
```

```ts
import {
  DataMapper, AutoDataMappingBuilder,
  StringNormalizer, NumberNormalizer, BooleanNormalizer, DateNormalizer, LowercaseNormalizer,
} from "@pristine-ts/data-mapping-common";

const dataMapper = new DataMapper(
  new AutoDataMappingBuilder(),
  [new StringNormalizer(), new NumberNormalizer(), new BooleanNormalizer(), new DateNormalizer(), new LowercaseNormalizer()],
  [],
);

const user = await dataMapper.autoMap(payload, User);
```

Errors go to `console.error` by default. Pass a custom `DataMapperErrorReporter` to the
constructor to redirect them.

## Backend / DI usage

If you're inside a Pristine app, import [`@pristine-ts/data-mapping`](../data-mapping)
instead — it wires `DataMapper` into the DI container, registers the built-in normalizers,
and routes errors through `LogHandlerInterface`. **See [`@pristine-ts/data-mapping`](../data-mapping)
for the full API reference** — everything documented there is also exported from this package.
