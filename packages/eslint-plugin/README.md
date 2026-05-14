# @pristine-ts/eslint-plugin

ESLint rules for projects using the [Pristine](https://github.com/magieno/pristine-ts) framework.

## Rules

### `@pristine-ts/inject-config-type-match`

Verifies that the parameter type on every `@injectConfig(...)` call matches the value type
recorded for that key in `PristineConfigurationValueMap`.

```ts
import {injectConfig} from "@pristine-ts/common";
import {RedisConfigurationKeys} from "@pristine-ts/redis";

@injectable()
export class RedisClient {
  constructor(
    @injectConfig(RedisConfigurationKeys.Port) private readonly port: number,    // ✓ ok
    @injectConfig(RedisConfigurationKeys.Host) private readonly host: number,    // ✗ host is string, not number
  ) {}
}
```

The rule reports the second line as a `typeMismatch` error.

#### Why this rule exists

TypeScript parameter decorators have no API to constrain the static type of the parameter
they decorate. The decorator's argument and the parameter's declared type live in
separate worlds at the type level. This lint rule bridges them.

#### How key→value type lookup works

Every `@pristine-ts/*` package augments the global `PristineConfigurationValueMap`
interface (declared in `@pristine-ts/common`) with its own keys via TypeScript
declaration merging. The rule reads the merged map to look up the expected type for
each key.

You can extend it with your own keys:

```ts
declare module "@pristine-ts/common" {
  interface PristineConfigurationValueMap {
    "my-app.feature-flag": boolean;
    "my-app.api-key": string;
  }
}
```

After this declaration, the rule will check `@injectConfig("my-app.feature-flag")` and
`@injectConfig("my-app.api-key")` calls in your code.

## Setup

Install the plugin:

```sh
npm install --save-dev @pristine-ts/eslint-plugin
```

Enable typed linting in your ESLint config (the rule needs the type checker):

```js
// .eslintrc.cjs
module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  plugins: ["@pristine-ts"],
  rules: {
    "@pristine-ts/inject-config-type-match": "error",
  },
};
```

Or use the recommended preset, which enables all rules in the plugin at the `error` level:

```js
extends: ["plugin:@pristine-ts/recommended"],
```

## Diagnostics

| Message ID | Meaning |
|---|---|
| `nonLiteralKey` | The first argument to `@injectConfig` did not resolve to a literal string. The rule cannot look up a non-literal key, so it reports rather than silently skipping. |
| `missingFromMap` | The key resolved to a literal string but is not declared in `PristineConfigurationValueMap`. Either the key is misspelled, or the package that owns it does not augment the global map yet. |
| `typeMismatch` | The expected value type for the key (from the merged map) is not assignable to the parameter's declared type. |

## Limitations

- Requires typed linting (`parserOptions.project`). Without it, the rule cannot resolve
  types at all and will silently no-op.
- The rule reads `PristineConfigurationValueMap` from the source files in the TypeScript
  program. If a package that owns the key is not in the import graph of any file the
  rule lints, the key will appear as `missingFromMap`. In practice this is rarely an
  issue: simply importing the keys constant for use is enough to put the value-map
  augmentation in scope.
