# @pristine-ts/data-mapping

Type-aware object mapping for [Pristine](https://github.com/magieno/pristine-ts). Convert
plain payloads (HTTP request bodies, database rows, queue messages) into typed class
instances — with renaming, coercion, validation, and nested-object support.

This package is the DI-wired wrapper. The framework-agnostic core lives in
[`@pristine-ts/data-mapping-common`](../data-mapping-common) and can be used standalone
in frontend bundles without pulling the DI container in.

## When to use

- HTTP request body → DTO class (used internally by `BodyMappingRequestInterceptor`)
- Database rows → entity classes (used by `@pristine-ts/mysql` and `@pristine-ts/aws`)
- Queue messages, CLI args, file contents → typed models
- Anywhere you have a plain object and want a typed one, with field renames and per-field coercion

## Install

```sh
npm install @pristine-ts/data-mapping
```

Import the module in your root `AppModule`:

```ts
import {DataMappingModule} from "@pristine-ts/data-mapping";

export const AppModule: AppModuleInterface = {
  keyname: "app",
  importModules: [DataMappingModule, /* ... */],
};
```

Then inject `DataMapper` anywhere:

```ts
import {injectable} from "tsyringe";
import {DataMapper} from "@pristine-ts/data-mapping";

@injectable()
export class UserService {
  constructor(private readonly dataMapper: DataMapper) {}
}
```

## Three ways to define a mapping

### 1. `autoMap` — by reflection on the destination class (the common case)

If your source object's field names already line up with your destination class, just hand
both to `autoMap`. The schema is inferred from `@property` / `@array` decorators on the
destination, cached per-class, and reused on subsequent calls.

```ts
import {classMetadata, property} from "@pristine-ts/metadata";
import {array} from "@pristine-ts/data-mapping";

@classMetadata()
class User {
  @property() id: string;
  @property() email: string;
  @property() age: number;
  @property() createdAt: Date;
  @array(String) tags: string[] = [];
}

const user = await this.dataMapper.autoMap(
  {id: "u1", email: "x@example.com", age: "37", createdAt: "2026-01-01", tags: ["a", "b"]},
  User,
);

user instanceof User;              // true
typeof user.age;                   // "number" — coerced from "37"
user.createdAt instanceof Date;    // true — coerced from string
```

`autoMap` also accepts an array as input and returns an array. Pass a `PrimitiveType` value
(`PrimitiveType.String | Number | Boolean | Date`) instead of a class to coerce a single
value:

```ts
import {PrimitiveType} from "@pristine-ts/data-mapping";

await dataMapper.autoMap("2026-01-01", PrimitiveType.Date);  // Date instance
await dataMapper.autoMap("42", PrimitiveType.Number);        // 42
```

### 2. The fluent builder — when you need rename or per-field config

When source field names don't match destination, or you need per-field normalizers, build an
explicit schema with `DataMappingBuilder`:

```ts
import {DataMappingBuilder, DataMapper, LowercaseNormalizerUniqueKey} from "@pristine-ts/data-mapping";

const builder = new DataMappingBuilder()
  .field("title", "name", {normalizers: [LowercaseNormalizerUniqueKey]})
  .field("status")                                              // single arg = no rename
  .nested("address", "address", a => {                          // single nested object
    a.field("street_name", "street")
      .field("zip", "postalCode");
  })
  .arrayOfObjects("items", "products", item => {                // array of objects
    item.field("sku", "sku")
        .field("qty", "quantity");
  })
  .arrayOfScalars("tag_list", "tags");                          // array of primitives

const result = await dataMapper.map(builder, sourceObject, DestinationClass);
```

The fluent API is sugar over a lower-level chain (`.add().setSourceProperty().setDestinationProperty().end()`)
which is still available — see the source for details.

### 3. `@bodyMapping` decorator (in HTTP controllers)

For HTTP controllers, `@pristine-ts/networking` ships a `@bodyMapping` decorator that runs
`DataMapper` automatically on the request body before your handler is called:

```ts
import {bodyMapping, controller, route, body} from "@pristine-ts/networking";

@controller("/users")
export class UserController {
  @route(HttpMethod.Post, "")
  @bodyMapping(User)
  async create(@body() user: User) {
    user instanceof User;  // true
  }
}
```

`@bodyMapping` accepts a class (uses `autoMap`), a `DataMappingBuilder`, or a function for
custom logic.

## Built-in normalizers

The module registers five built-in normalizers, keyed under `"DataNormalizerInterface"` and
available via `resolveAll`:

| Key | Class | Coerces to |
|---|---|---|
| `PRISTINE_STRING_NORMALIZER` | `StringNormalizer` | `string` (handles numbers, booleans, dates, objects) |
| `PRISTINE_NUMBER_NORMALIZER` | `NumberNormalizer` | `number` (parses numeric strings) |
| `PRISTINE_BOOLEAN_NORMALIZER` | `BooleanNormalizer` | `boolean` (`"true"`/`"1"`/`1` → true) |
| `PRISTINE_DATE_NORMALIZER` | `DateNormalizer` | `Date` (parses ISO strings, ms/sec timestamps, `{year, month, day}` objects) |
| `PRISTINE_LOWERCASE_NORMALIZER` | `LowercaseNormalizer` | lowercased `string` |

`autoMap` wires the first four automatically based on `@property` types. `LowercaseNormalizer`
is opt-in per field.

### Writing your own

Implement `DataNormalizerInterface`, then register it under the `"DataNormalizerInterface"`
tag — Pristine's `@tag` decorator handles registration:

```ts
import {injectable} from "tsyringe";
import {tag} from "@pristine-ts/common";
import {DataNormalizerInterface, DataNormalizerUniqueKey} from "@pristine-ts/data-mapping";

export const TrimNormalizerUniqueKey = "MY_APP_TRIM_NORMALIZER";

@tag("DataNormalizerInterface")
@injectable()
export class TrimNormalizer implements DataNormalizerInterface<string, undefined> {
  getUniqueKey(): DataNormalizerUniqueKey { return TrimNormalizerUniqueKey; }
  normalize(source: any): string {
    return typeof source === "string" ? source.trim() : source;
  }
}
```

Then use the key in a builder:

```ts
builder.field("name", "name", {normalizers: [TrimNormalizerUniqueKey]});
```

## Interceptors

Run logic before / after a whole mapping (not per-field). Useful for combining fields,
adding computed values, or post-processing the result.

```ts
import {tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {DataMappingInterceptorInterface, DataMappingInterceptorUniqueKeyType} from "@pristine-ts/data-mapping";

@tag("DataMappingInterceptorInterface")
@injectable()
export class CombineNamesInterceptor implements DataMappingInterceptorInterface {
  getUniqueKey(): DataMappingInterceptorUniqueKeyType { return "combine_names"; }

  async beforeMapping(row: any): Promise<any> {
    return {...row, fullName: `${row.firstName} ${row.lastName}`};
  }

  async afterMapping(row: any): Promise<any> {
    return row;
  }
}
```

Wire it into a builder by key:

```ts
new DataMappingBuilder()
  .addBeforeMappingInterceptor("combine_names")
  .field("fullName", "name");
```

The framework applies before-interceptors in registration order, then maps fields, then
runs after-interceptors. Each receives the optional `options` payload you passed to
`addBeforeMappingInterceptor` / `addAfterMappingInterceptor`.

## Schema cache

`AutoDataMappingBuilder` caches the schema it infers for each destination class in a
`WeakMap`. Repeated `autoMap` calls against the same class reuse the cached schema instead
of rewalking metadata every time.

**Measured impact** (benchmark in `auto-data-mapping.builder.cache-benchmark.spec.ts`):

| Workload | Speed-up | Notes |
|---|---|---|
| Schema-build step alone | ~80× | Upper bound — the only thing the cache saves |
| Full `autoMap` on a typical REST body (~10 fields, 1 nested object) | ~1.6× | The hot path for `BodyMappingRequestInterceptor` |
| Full `autoMap` on a deep+wide schema (6 levels, arrays at every level) | ~1.03× | Map cost dominates; cache barely matters here |
| Memory cost | ~12 KB per cached class | `WeakMap` — dropped classes are reclaimed |

Bypass the cache when source-shape inference must vary per call (e.g. an untyped scalar
array where the element type is inferred from `source[0]`):

```ts
import {AutoDataMappingBuilderOptions} from "@pristine-ts/data-mapping";

await dataMapper.autoMap(source, DestClass, new AutoDataMappingBuilderOptions({disableCache: true}));
```

## Error reporting

`autoMap` catches errors during inference / mapping and (by default) returns the source
unchanged. Behavior is controlled by two options:

```ts
await dataMapper.autoMap(source, DestClass, new AutoDataMappingBuilderOptions({
  throwOnErrors: true,   // re-throw instead of swallowing; default false
  logErrors: true,       // emit a report; default false
}));
```

When `logErrors: true` is set, reports go to the error reporter wired into the `DataMapper`:

- Inside the framework (this module), reports route to `LogHandlerInterface.error(...)`,
  flowing through `LogStore`, Sentry, etc.
- Outside the framework (frontend usage, see below), the default reporter writes to
  `console.error` with a `[DataMapper]` prefix.

To use a custom sink, construct `DataMapper` manually with your own
`DataMapperErrorReporter`:

```ts
import {DataMapper, ConsoleErrorReporter} from "@pristine-ts/data-mapping";

const dataMapper = new DataMapper(
  autoBuilder, normalizers, interceptors,
  (error, context) => {
    sendToSentry(error);
    ConsoleErrorReporter.report(error, context);   // compose with the built-in
  },
);
```

Pass `() => {}` to silence reports entirely even when `logErrors: true`.

## Frontend usage (`@pristine-ts/data-mapping-common`)

The `DataMapper` class lives in `@pristine-ts/data-mapping-common`, which has no DI or
logging dependency. Use it directly in Angular / browser bundles:

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

The frontend build gets the same API surface, just without auto-wiring. Errors go to
`console.error` by default — pass a custom reporter to the constructor to redirect.

## Mapping behavior reference

A few non-obvious rules worth knowing:

- **Renames drop the source key.** When a node has both `sourceProperty: "title"` and
  `destinationProperty: "name"`, only `name` appears on the result. The old key is not
  carried through.
- **Extraneous values.** When `excludeExtraneousValues` is `false` (default), source
  properties not covered by the schema are copied through. When `true`, only explicitly-
  mapped destination properties end up on the result. This applies recursively to nested
  objects.
- **Missing optional fields** are skipped silently. Missing required fields throw
  `DataMappingSourcePropertyNotFoundError`. Mark fields optional via `setIsOptional(true)`
  or `field(src, dst, {isOptional: true})`.
- **Unknown normalizer keys throw.** Adding a `normalizerUniqueKey` to a leaf that isn't
  registered with the `DataMapper` raises `DataNormalizerNotFoundError` at map time.
- **`export()` / `import()` of a builder schema.** `DataMappingBuilder.export()` returns a
  serializable plain object and does NOT mutate the live tree (the builder remains usable
  after exporting). On `import()`, the `destinationType` field is intentionally not
  rehydrated — it's a class constructor that can't be transferred. Decorate the destination
  class with `class-transformer`'s `@Type()` to recover class identity on round-tripped schemas.

## Errors thrown

| Error | When |
|---|---|
| `DataMappingSourcePropertyNotFoundError` | Required source field missing |
| `DataNormalizerNotFoundError` | Leaf references a normalizer key that wasn't registered |
| `DataMappingInterceptorNotFoundError` | Builder references an interceptor key that wasn't registered |
| `DataNormalizerAlreadyAdded` | Same normalizer key added twice to one leaf (or to leaf + root) |
| `DataBeforeMappingInterceptorAlreadyAddedError` / `DataAfterMappingInterceptorAlreadyAddedError` | Same interceptor key added twice |
| `ArrayDataMappingNodeInvalidSourcePropertyTypeError` | ScalarArray / ObjectArray node received a non-array source |
| `UndefinedSourcePropertyError` / `UndefinedDestinationPropertyError` | `end()` called on a node without setting source / destination property |
| `AutoMapPrimitiveTypeNormalizerNotFoundError` | `autoMap(value, PrimitiveType.X)` called for a primitive type whose normalizer isn't registered |
| `NormalizerInvalidSourceTypeError` | Normalizer with `shouldThrowIfTypeIsNotString: true` received a non-string |

## Related packages

- [`@pristine-ts/data-mapping-common`](../data-mapping-common) — framework-agnostic core (use directly in frontend)
- [`@pristine-ts/metadata`](../metadata) — `@property` / `@classMetadata` decorators the auto-builder reads
- [`@pristine-ts/networking`](../networking) — `@bodyMapping` and `BodyMappingRequestInterceptor`
