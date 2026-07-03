# Changelog — @pristine-ts/cli

## 3.0.7

### Fixed

- **`pristine build` now writes relocatable build manifests.** `.pristine/build-manifest.json`
  recorded the AppModule source/output as **absolute** paths, so a project built in one directory
  and then moved or copied elsewhere — e.g. an installer that builds in a staging dir and swaps the
  result into place — saw a permanent `appModule.sourcePath no longer matches the last build`
  staleness prompt, which in a non-interactive or repeatedly-spawned context could loop
  indefinitely. The manifest now stores paths **relative to the project root**, and
  `BuildManifestChecker` resolves them against the current root before comparing. Manifests written
  by older versions (absolute paths) keep validating unchanged, since `path.resolve` leaves an
  already-absolute path untouched.

## 3.0.5

Hardening of `@pristine-ts/cli` for ESM / bundled runtimes, following the `__dirname is not
defined` boot crash fixed in 3.0.4. Note that the `HttpModule → CliModule` decoupling changes one
observable default for HTTP/Lambda apps — see the migration note below.

### Fixed / Changed

- **CLI version reporting now works in bundled ESM (no more `"unknown"`).** The version shown by
  `pristine info` comes from a build-time constant (`src/generated/version.ts`, generated from
  `package.json` by `scripts/generate-version.mjs`) instead of a runtime `package.json` read. A
  baked-in constant resolves identically in CommonJS, native ESM, and bundled ESM — no filesystem
  access, no `__dirname`, no `import.meta`. The runtime path-resolution helper
  (`CliPackageJsonResolver`) is removed, since the constant supersedes it entirely.

  The constant is generated on `prebuild`, `pretest`, and `prepack`. The `prepack` hook is what
  keeps a published release correct: `lerna publish` bumps `package.json` and then packs, and
  `prepack` rebuilds from the just-bumped version so the shipped tarball always reports the right
  version. `src/generated/version.ts` is a generated file and is git-ignored.

- **`HttpModule` no longer imports `CliModule`.** Importing the full `CliModule` dragged the entire
  `@pristine-ts/cli` package — every command, the REPL event handlers, terminal/readline machinery,
  the build/plugin bootstrap, and CLI-only config keys — into every HTTP/Lambda app and consumer
  ESM bundle, none of which runs there. `HttpModule` now imports only the framework modules it
  actually used (`Core`, `DataMapping`, `Observability`, `Validation`; `Logging` was already
  direct), so its service graph is unchanged while the CLI package is dropped entirely. HttpModule's
  own `file-server:start` command still works under `pristine` because `Cli.bootstrap` always wraps
  the AppModule with `CliModule`.

### Added

- Regression guards:
  - `HttpModule` boots a kernel and runs the per-event `EventDispatcher` construction without
    throwing, and its module graph provably excludes `@pristine-ts/cli`
    (`packages/http/src/http.module.esm-boot.spec.ts`).
  - A static ESM-safety check that fails CI if any `packages/*/src` file uses a bare
    `__dirname`/`__filename`/`import.meta` outside a `typeof` guard
    (`packages/cli/src/esm-safety.guard.spec.ts`).

### Migration notes

- **HTTP/Lambda console logging default changed from `Pretty` to `Json`.** HTTP apps previously
  inherited the CLI's `Pretty` console output mode (and `Info` severity) because `HttpModule`
  transitively imported `CliModule`, whose `configDefaults` overrode `LoggingModule`. With
  `CliModule` no longer in the HTTP graph, HTTP/Lambda apps now use `LoggingModule`'s own default:
  `consoleLoggerOutputMode = Json` (structured, the correct default for production log aggregation).
  Severity is unchanged (`Info` in both).

  If you want the previous CLI-style pretty logging in an HTTP app, set it explicitly in
  `pristine.config.ts` (or via env var):

  ```ts
  // pristine.config.ts
  export const config = {
    "pristine.logging.consoleLoggerOutputMode": "pretty",
  };
  // or: PRISTINE_LOGGING_CONSOLE_LOGGER_OUTPUT_MODE=pretty
  ```

- **No API or import changes are required.** Running the CLI (`pristine <command>`) is unaffected —
  `Cli.bootstrap` still wraps your AppModule with `CliModule`, so all CLI commands (including
  HttpModule's `file-server:start`) remain available.

## 3.0.4

- **Fixed `ReferenceError: __dirname is not defined` at kernel start in ESM-bundled apps.**
  `InfoCommand` read `__dirname` in an eager field initializer that ran during DI construction;
  because `HttpModule` imported `CliModule` transitively, this fired in every HTTP/Lambda app and
  crashed consumers who bundled to ESM. The path lookup moved into `CliPackageJsonResolver`
  (lazy, `typeof __dirname`-guarded, degrades to `"unknown"`), and `CliEventHandler` now resolves
  commands lazily from the current child container instead of `@injectAll` at construction, so
  commands are only built on the CLI path — never per request in HTTP/Lambda.
