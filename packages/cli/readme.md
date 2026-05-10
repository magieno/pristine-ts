# `@pristine-ts/cli`

The Pristine CLI. Provides:

- A `pristine` binary you can invoke from any project that depends on Pristine.
- A registration mechanism for custom commands (your own `pristine my-command ...`).
- Built-in commands for verification, listing, configuration, and diagnostics.
- A `pristine.config.ts` config system that drops the old `package.json` glue.

This document covers everything you need to install, configure, and extend the CLI.

---

## Installation

```sh
npm install @pristine-ts/cli
```

After install, `node_modules/.bin/pristine` is available — invoke it via `npx pristine`,
through an npm script, or by adding `node_modules/.bin` to your PATH.

For host-wide invocation (CI machines, deploy boxes, dev machines), install globally:

```sh
npm install -g @pristine-ts/cli
```

The bin is a single self-contained file (~1.5 KB) that defers to `@pristine-ts/cli` resolved
from your project's `node_modules`. There is no transitive resolution lookup tree the bin
itself walks — its only requirement is that `require('@pristine-ts/cli')` resolves from where
the bin file lives. Both `npm install` (locally) and `npm install -g` satisfy this.

---

## Quick start

In an existing Pristine project:

```sh
npx pristine p:config:init        # creates pristine.config.ts in the project root
npx pristine p:list               # lists all registered commands
npx pristine p:verify             # smoke-tests your AppModule and configuration
```

You're done. No `package.json` config required.

For a brand-new project with a conventional layout (an `app.module.{js,mjs,cjs}` somewhere
under `dist/`), even `pristine p:config:init` is optional — the CLI auto-discovers the
AppModule on first run.

---

## Configuration

The canonical configuration file is `pristine.config.ts` at the project root.

```ts
import {defineConfig} from "@pristine-ts/cli";

export default defineConfig({
  appModule: {
    path: "dist/app.module.js",
    // export: "AppModule",   // override if your file exports a different symbol
  },

  // Reserved for upcoming `pristine build` (Phase 4).
  build: {
    outDir: "dist",
    tsconfig: "tsconfig.json",
    format: "esm",
  },

  // Reserved for upcoming `pristine start` (Phase 4).
  start: {
    entry: "dist/main.js",
    nodeArgs: ["--enable-source-maps"],
  },

  // Reserved for upcoming plugin discovery (Phase 5).
  plugins: [
    // "@my-org/pristine-cli-extras",
  ],

  // Configuration values layered onto `kernel.start()`. Lets you keep CLI-only runtime
  // overrides out of your AppModule — they only apply when the kernel boots via the CLI.
  kernelConfiguration: {
    // "pristine.logging.logSeverityLevelConfiguration": 1,
  },
});
```

### Config file format

Any of the following is recognised, in this preference order:

1. `pristine.config.ts` *(canonical — typed, full IDE autocomplete via `defineConfig`)*
2. `pristine.config.mts`
3. `pristine.config.cts`
4. `pristine.config.js`
5. `pristine.config.mjs`
6. `pristine.config.cjs`

`.ts` configs are loaded at runtime via `jiti` — no separate compile step needed.

The CLI walks **upward** from `process.cwd()` looking for any of these names, so a CLI
invocation from `packages/foo/` in a monorepo still finds a `pristine.config.ts` at the
repo root.

### Config schema

```ts
interface PristineConfig {
  appModule?: {
    path: string;       // resolved relative to the config file's directory
    export?: string;    // default "AppModule"
  };
  build?: {
    outDir?: string;
    tsconfig?: string;
    format?: "esm" | "cjs" | "both";
    clean?: boolean;
  };
  start?: {
    entry?: string;
    watch?: boolean | { paths: string[]; ignore?: string[] };
    nodeArgs?: string[];
  };
  plugins?: Array<string | { name: string; options?: unknown }>;
  kernelConfiguration?: Record<string, unknown>;
}
```

All fields are optional. The CLI applies sensible defaults wherever a field is absent.

### Migrating from `package.json`

Older Pristine versions stored config in `package.json` under a `pristine` field:

```json
{
  "pristine": {
    "appModule": { "cjsPath": "dist/lib/cjs/app.module.js" }
  }
}
```

Both `pristine.appModule.cjsPath` (deprecated) and `pristine.appModule.path` (new,
format-agnostic) are still read for one minor cycle. When `cjsPath` is read, the CLI
prints a one-line deprecation warning to stderr.

To migrate cleanly, run:

```sh
npx pristine p:config:init
```

The command detects the existing `pristine.appModule.{path,cjsPath}` field, generates a
`pristine.config.ts` with the path migrated, and tells you to delete the `pristine` field
from `package.json`.

---

## AppModule discovery

When the CLI starts, it locates your AppModule using the following cascade. The first
match wins; later steps run only if no earlier step resolved a path.

1. **`pristine.config.{ts,…}`'s `appModule.path`** — the canonical location.
2. **`package.json` → `pristine.appModule.path`** *(legacy, still supported).*
3. **`package.json` → `pristine.appModule.cjsPath`** *(deprecated, warns).*
4. **`.pristine/last-app-module`** — the previously-selected path from a TTY prompt
   (see step 5). Stale entries (target file deleted) are auto-cleaned.
5. **Convention scan** of these directories, non-recursive:
   - `dist/`
   - `dist/lib/cjs/`
   - `dist/lib/esm/`
   - `build/`
   - the project root (`.`)

   A file is a candidate when its name matches `*.module.{js,mjs,cjs}` AND either:
     - its filename literally matches `app.module.{js,mjs,cjs}` (highest confidence,
       score `0`), OR
     - its exports include a symbol named `AppModule` (score `10`).

   Files matching `*.spec.*` or `*.test.*` are excluded.

   - **One candidate** → use it.
   - **Multiple candidates with one outranking the rest** (e.g. one `app.module.js`
     plus other `*.module.js` files that happen to export `AppModule`) → use the
     top-ranked candidate without prompting.
   - **Multiple equally-ranked candidates AND interactive terminal** → prompt the user
     to pick one (uses `@inquirer/prompts`). The selection is cached to
     `.pristine/last-app-module` so subsequent runs in the same project skip the prompt.
   - **Multiple equally-ranked candidates AND non-interactive** (CI, Docker, redirected
     stdin) → exit with an actionable error listing the candidates and showing the
     `pristine.appModule.path` snippet to set. Never guesses in non-interactive mode.

6. **Legacy `node_modules/@pristine-ts/*` scan** — when no project AppModule is
   discoverable at all, the CLI builds a synthetic AppModule from every `*.module.js`
   it finds under `node_modules/@pristine-ts/*/dist/lib/cjs/`. Useful when invoking
   `pristine` against a vendored Pristine installation.

7. **Built-in `CliModule` fallback** — when even step 6 turns up nothing (e.g. the bin
   was invoked outside any project), the CLI synthesizes an AppModule that imports
   `CliModule` only. Built-in commands (`p:help`, `p:list`, `p:config:print`, …) remain
   runnable. Custom commands are unavailable in this state, of course.

If a configured/discovered AppModule fails to load (file missing, import error), the CLI
prints both the configured path and the underlying error to stderr, then **falls back to
the built-in CliModule** so commands like `p:config:init` and `p:config:print` remain
usable for fixing the broken config.

### Module-format support

The loader uses Node's dynamic `import()` (real `import()`, not the tsc-lowered
`require()`), so all of the following work for an AppModule entry:

| Extension | Load via | Notes |
|-----------|----------|-------|
| `.js` (CJS) | `import()` | Default for tsc CommonJS output. |
| `.cjs`      | `import()` | Explicit CJS. |
| `.mjs`      | `import()` | ESM. |
| `.js` (ESM, in a `"type": "module"` package) | `import()` | ESM via package context. |

The configured path is wrapped in `pathToFileURL()` before import, so absolute paths and
Windows paths are handled correctly.

---

## Built-in commands

Every framework-reserved command has a canonical `p:` prefixed name and a top-level alias.
Use whichever you prefer — `pristine help` and `pristine p:help` are equivalent.

| Command | Alias | Purpose |
|---------|-------|---------|
| `pristine p:help` | `help` | Show a usage banner and list every registered command (built-in and custom) with its description. |
| `pristine p:list` | `list` | Print every registered command's name. Shorter output than `help`. |
| `pristine p:info` | `info` | Print framework version, Node version, OS, resolved config path, AppModule location, and the recursively-resolved list of imported modules. Useful for support tickets. |
| `pristine p:build` | `build` | Compile the project's TypeScript via `tsc`. Reads `build.{outDir,tsconfig,format,clean}` from `pristine.config.ts`. Format `"both"` runs the primary tsconfig then the matching `*.cjs.json` sibling. |
| `pristine p:start` | `start` | Boot the AppModule, register signal handlers, and keep the process alive. SIGTERM or SIGINT triggers `Kernel.stop()` (reverse-instantiation `onShutdown` hooks with per-hook timeout); a second signal forces immediate exit. Production-grade entry point. |
| `pristine p:verify` | `verify` | Run a fresh kernel boot, capture per-phase outcomes, execute every registered `InstantiationTestInterface`. Exits non-zero on failure. `--skip-tests` skips the embedder-test phase. |
| `pristine p:config:init` | — | Create a starter `pristine.config.ts`. Migrates an existing `pristine.appModule.{path,cjsPath}` field from `package.json` if present. Refuses to overwrite an existing config file. |
| `pristine p:config:print` | — | Print the resolved config plus the file path it was loaded from and per-field provenance markers. Use this when discovery is doing something unexpected. |

`config:*` commands deliberately don't have top-level aliases — they're sub-commands by design and the namespaced form keeps that clear.

---

## Adding your own commands

Custom commands are tsyringe-decorated classes in your AppModule's import graph. You
register them once and `pristine your-command-name` invokes them.

### Minimal example

```ts
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CommandInterface, ConsoleManager, ExitCodeEnum} from "@pristine-ts/cli";
import {YourModuleKeyname} from "./your.module.keyname";

@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(YourModuleKeyname)
@injectable()
export class HelloCommand implements CommandInterface<null> {
  optionsType = null;
  name = "hello";

  constructor(private readonly consoleManager: ConsoleManager) {}

  async run(args: any): Promise<ExitCodeEnum | number> {
    this.consoleManager.writeSuccess("Hello from Pristine CLI!");
    return ExitCodeEnum.Success;
  }
}
```

Then ensure `HelloCommand` is reachable from your AppModule's import graph (either via
the module's `providerRegistrations` or via a re-export from a file your `AppModule`
transitively imports — the `@tag` decorator self-registers as soon as the class is loaded).

Run it:

```sh
npx pristine hello
```

### Typed CLI options

For commands that accept arguments, declare an options class decorated with
`class-validator` decorators and set `optionsType` to it. `CliEventHandler` validates
the parsed options before invoking `run`.

```ts
import {IsString, IsOptional} from "class-validator";

class GreetOptions {
  @IsString() name!: string;
  @IsOptional() @IsString() language?: string;
}

@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(YourModuleKeyname)
@injectable()
export class GreetCommand implements CommandInterface<GreetOptions> {
  optionsType = GreetOptions;
  name = "greet";

  async run(args: GreetOptions): Promise<ExitCodeEnum | number> {
    // args.name is guaranteed non-null here.
    return ExitCodeEnum.Success;
  }
}
```

Invoke as:

```sh
npx pristine greet --name=Alice --language=fr
```

Validation failures exit non-zero with a printed list of the validation errors.

### Plugins (commands from external packages)

Custom commands can also live in **separate npm packages** that the user opts into via
`pristine.config.ts` `plugins`. This is the right shape for tooling-only commands you don't
want loaded into your production runtime AppModule (generators, linters, codemods, etc.).

**Plugin author contract:**

A plugin package exports one or more `*Module` symbols. Each module is a regular
`ModuleInterface` — declare commands the same way you would in your AppModule.

```ts
// my-plugin/src/index.ts
import {ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {moduleScoped, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CommandInterface, ConsoleManager, ExitCodeEnum} from "@pristine-ts/cli";

@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped("my-plugin")
@injectable()
export class HelloCommand implements CommandInterface<null> {
  optionsType = null;
  name = "my-plugin:hello";
  description = "Says hello.";
  constructor(private readonly consoleManager: ConsoleManager) {}
  async run() { this.consoleManager.writeLine("Hello!"); return ExitCodeEnum.Success; }
}

export const MyPluginModule: ModuleInterface = {
  keyname: "my-plugin",
  providerRegistrations: [
    // Or rely on the @tag decorator's self-registration if your AppModule's import graph
    // reaches this file. providerRegistrations is the explicit form.
  ],
};
```

**Consumer config:**

```ts
// pristine.config.ts
import {defineConfig} from "@pristine-ts/cli";

export default defineConfig({
  appModule: {path: "dist/app.module.js"},
  plugins: [
    "my-plugin",                              // string form: package name
    {name: "@my-org/other-plugin", options: {}}, // object form (options reserved for future use)
  ],
});
```

`pristine` resolves each plugin package from your **project's** `node_modules` (using
`createRequire` anchored at the config file's location, so monorepos with hoisted deps work).
The CLI imports the plugin, harvests every export ending in `Module` whose value has a
`keyname`, and folds those modules into a wrapper AppModule so the kernel boots them
alongside your user-authored modules.

**Failure handling:**

- A plugin that fails to resolve or import prints a clear stderr error and the CLI continues
  without it (built-in commands like `pristine p:config:print` still work so you can debug).
- A plugin that exports no `*Module` symbols also fails loudly — silent loading would make
  "why isn't my command showing up" undebuggable.
- When two plugins (or a plugin and a built-in) register commands with the same name, the
  CLI prints a stderr warning but continues; the first registered match is dispatched.
  Rename one of the conflicting commands to fix.

**Diagnostics:**

`pristine info` lists every loaded plugin under a `Plugins (N)` section, plus the wrapped
AppModule keyname (`<your-keyname>.with-plugins` when plugins are present).

### Adding a built-in `InstantiationTestInterface`

Embedders can contribute health checks that run as part of `pristine p:verify`. See the
`@pristine-ts/core` README for the full `InstantiationTestInterface` contract; a tagged
implementation is enough:

```ts
import {tag, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {injectable, DependencyContainer} from "tsyringe";
import {InstantiationTestInterface, InstantiationTestResultInterface} from "@pristine-ts/core";

@tag(ServiceDefinitionTagEnum.InstantiationTest)
@injectable()
export class DatabaseConnectivityTest implements InstantiationTestInterface {
  name = "database connectivity";

  async run(container: DependencyContainer): Promise<InstantiationTestResultInterface> {
    try {
      await container.resolve(MyDbClient).ping();
      return {passed: true};
    } catch (e) {
      return {passed: false, message: (e as Error).message};
    }
  }
}
```

`pristine p:verify` will discover and run it automatically.

---

## Architecture & cross-realm safety

The bin is a thin shim that does:

```js
require("reflect-metadata");
require("@pristine-ts/cli").bootstrap();
```

This is deliberate. An earlier design bundled the entire CLI into the bin file; this
caused a "TypeInfo not known for X" error in real consumer projects because tsyringe's
decorator metadata is keyed by class identity, and bundling produced a *second* set of
class identities (the bundled copy) that didn't share metadata with the consumer's
`node_modules`-loaded copy.

The current design loads `@pristine-ts/cli` from the consumer's `node_modules`. This
guarantees that whichever `@pristine-ts/cli` class your AppModule imports is the same
physical class the bin reaches for — single identity, single decorator metadata
registration, no mismatch.

Side effect: `reflect-metadata`, `tsyringe`, and `class-transformer` are not declared as
direct dependencies of `@pristine-ts/cli` even though the bin uses them. They come
transitively through `@pristine-ts/common` (which every Pristine package depends on).
Declaring them directly would cause npm to install duplicate copies in
`packages/cli/node_modules/`, and `reflect-metadata` in particular keeps its decorator
WeakMap inside the module closure — two copies = two WeakMaps = silently lost metadata.

---

## Production deployment

You have two equally-supported options for running a Pristine app in production.

### Option A — `node dist/main.js`

Traditional approach. Your `dist/main.js` is the entry point. Doesn't require shipping
`@pristine-ts/cli` to the deployment host. Lifecycle, signal handling, and graceful
shutdown are entirely your responsibility (or your AppModule's).

### Option B — `pristine start`

`pristine start` (or `pristine p:start`) is also a production-grade entry point. It:

- Boots the AppModule via the same loader as the rest of the CLI.
- Discovers and starts every registered `RuntimeServerInterface` (HTTP server, gRPC server,
  etc.) — no extra wiring needed. Importing `@pristine-ts/http` is enough for `pristine
  start` to listen on the configured port.
- Registers `SIGTERM` and `SIGINT` handlers — the first signal triggers a graceful shutdown
  via `Kernel.stop()`, which walks every instantiated module's `onShutdown` hook in
  outer-to-inner order with a per-hook timeout. A second signal force-exits.
- Enforces a hard-exit timeout (30 seconds) so a wedged shutdown can never block your
  orchestrator (Kubernetes / ECS / systemd) indefinitely.
- Keeps the event loop alive on its own (no need for your modules to register a heartbeat).

#### Hosting an HTTP server with `pristine start`

If your AppModule imports `@pristine-ts/http`, `pristine start` automatically launches the
built-in `KernelHttpServer`. Every incoming request is routed through `kernel.handle()` →
the `@pristine-ts/networking` `Router` → your controllers. No glue code needed.

```ts
import {ModuleInterface} from "@pristine-ts/common";
import {CoreModule} from "@pristine-ts/core";
import {HttpModule} from "@pristine-ts/http";
import {NetworkingModule} from "@pristine-ts/networking";
import {DogsController} from "./controllers/dogs.controller";

export const AppModule: ModuleInterface = {
  keyname: "my.app",
  importModules: [CoreModule, HttpModule, NetworkingModule],
  importServices: [DogsController],
};
```

```sh
npx pristine start
# Pristine app running with 1 server(s): http. Send SIGTERM (or Ctrl+C) to stop.
```

**Configuring port and address.** Three layers, highest-priority first:

| Source | Example |
|--------|---------|
| CLI flag | `pristine start --port=4000 --address=127.0.0.1` |
| Config file | `start.http: { port: 4000, address: "127.0.0.1" }` in `pristine.config.ts` (Phase 5) |
| Module config | `pristine.http.kernel-server.port` in `pristine.config.ts` `kernelConfiguration` |
| Environment variable | `PRISTINE_HTTP_KERNEL_SERVER_PORT=4000`, `PRISTINE_HTTP_KERNEL_SERVER_ADDRESS=0.0.0.0` |
| Default | `0.0.0.0:3000` |

Defaults follow Node convention: bind on all interfaces (`0.0.0.0`), port 3000.

**HTTPS.** Set the TLS key and cert paths and the kernel server switches from `http.Server`
to `https.Server` automatically:

| Source | Example |
|--------|---------|
| Module config | `pristine.http.kernel-server.tls.key-path` + `.cert-path` |
| Environment variable | `PRISTINE_HTTP_KERNEL_SERVER_TLS_KEY_PATH=/etc/ssl/key.pem`, `..._TLS_CERT_PATH=/etc/ssl/cert.pem` |

When both are set to non-empty values, `pristine start` reads the PEM files at boot and
hosts HTTPS instead of HTTP. The `name` reported in logs and via `RuntimeServerInterface`
flips from `"http"` to `"https"` accordingly.

**Graceful drain.** When `pristine start` receives SIGTERM, `KernelHttpServer.stop()` is
called via `HttpModule.onShutdown` (which runs as part of `Kernel.stop()`). It calls
`server.close()` (refuses new connections, lets in-flight requests finish), then waits up
to 10 seconds for connection drain before force-closing remaining sockets. This matches
what container orchestrators expect during a rolling deploy.

**Custom server types.** Any module can register its own server by implementing
`RuntimeServerInterface` and tagging the class with
`@tag(ServiceDefinitionTagEnum.RuntimeServer)`. `pristine start` will discover and launch
it alongside the HTTP server. This is how future modules (gRPC, websocket, etc.) plug in
without `@pristine-ts/cli` having to know about them.

To use it in production:

```sh
npm install -g @pristine-ts/cli         # one-time, on the host
pristine start                           # from your project directory
```

Or, in a Dockerfile:

```dockerfile
RUN npm install -g @pristine-ts/cli
CMD ["pristine", "start"]
```

### Implementing graceful shutdown in your modules

Add an `onShutdown` hook to any `ModuleInterface`:

```ts
export const MyModule: ModuleInterface = {
  keyname: "my.module",
  onShutdown: async (container) => {
    await container.resolve(MyDbClient).close();
    await container.resolve(MyQueueConsumer).drain();
  },
};
```

Hooks run in outer-to-inner order so a high-level module (your AppModule, your HTTP server)
can still call into its dependencies (DB connection pool, logging) while it tears itself
down. Each hook has a 10-second timeout by default — exceeding it logs a warning and
shutdown continues with the next module.

`onShutdown` is optional — modules that don't need cleanup just don't declare it.

---

## What changed (versus pre-1.0.440)

**Phase 6 (this release):**

- **End-to-end smoke tests for the bin.** `tests/cli` now exercises every Phase 1–5
  command (`pristine sample`, `pristine help`, `pristine list`, `pristine info`,
  `pristine p:config:print`, `pristine p:verify`) plus the unknown-command failure path,
  via the actual built `pristine` binary spawned by jest.
- **`pristine.config.ts` migration in `tests/cli`.** The old `package.json` `pristine.appModule.cjsPath`
  field was removed in favor of a real `pristine.config.ts` — this is the canonical example
  of how a downstream consumer should set things up.
- **CI runs the e2e suite.** `npm run e2e` now invokes `tests/cli`'s suite in addition to
  `tests/e2e`. The install script (`install_packages.sh`) was extended to install deps for
  every `tests/*` harness, not just `packages/*`.

**Phase 5:**

- **Plugin discovery via `pristine.config.ts`'s `plugins` array.** Tooling-only command
  packages can be opted into without polluting the runtime AppModule. Plugins are resolved
  from the project's `node_modules` (via `createRequire` anchored at the config file).
- **Plugin failure is non-fatal.** A missing or broken plugin prints a clear stderr error and
  the CLI continues with built-in commands intact, so `pristine p:config:print` still works
  for debugging.
- **`pristine info` lists loaded plugins** under a dedicated `Plugins (N)` section.
- **Command-name collisions warn loudly.** When two registered commands share a name, the CLI
  prints a stderr warning at boot listing the count. The first registered match is dispatched
  (no silent shadowing).

**Phase 4:**

- **`pristine start` hosts HTTP servers automatically.** When your AppModule imports
  `@pristine-ts/http`, `pristine start` discovers `KernelHttpServer` (a new
  `RuntimeServerInterface` implementation) and launches it. Requests are routed through
  `kernel.handle()` → `Router` → your controllers. HTTPS supported when TLS key/cert
  paths are configured. Configurable port/address via env var, config file, or `--port` /
  `--address` CLI flags.
- **`pristine start` is a real production entry point.** Boots the AppModule, handles
  SIGTERM/SIGINT, runs `onShutdown` hooks via `Kernel.stop()`, enforces a hard-exit
  timeout. Use it instead of (or alongside) `node dist/main.js`.
- **`RuntimeServerInterface` and `ServiceDefinitionTagEnum.RuntimeServer`** added so any
  module can plug a long-running server (HTTP, gRPC, websocket, etc.) into `pristine
  start` without `@pristine-ts/cli` having to know about each protocol.
- **`Kernel.stop()` and `ModuleInterface.onShutdown`** added to `@pristine-ts/core` and
  `@pristine-ts/common`. Optional, additive — existing modules without an `onShutdown`
  hook continue to work unchanged.
- **`pristine info`** prints framework version, runtime environment, resolved config
  path, AppModule location, and the imported module graph. Designed for support tickets.
- **`pristine build`** wraps `tsc` and reads `build.{outDir,tsconfig,format,clean}` from
  `pristine.config.ts`. `format: "both"` runs both your primary tsconfig and a
  `*.cjs.json` sibling sequentially.
- **`pristine help`** is now generated from the live command registry — every registered
  command (built-in and custom) shows up automatically with its declared description.
- **Top-level aliases**: `pristine help`, `pristine list`, `pristine verify`, `pristine
  info`, `pristine build`, `pristine start`. The `p:*` canonical names still work.
- **`CommandInterface.description`** added (optional). Used by `help` for one-line
  summaries. Existing commands without a description show up in help with an empty
  description column.
- **Pre-existing `ListCommand` bug fixed** (it used to misuse `@injectAll(CurrentChildContainer)`
  and crash). Lazy-resolves the command list from `Kernel.container` instead.

**Phase 1-3 (earlier):**


- **CLI is no longer locked to CJS-compiled AppModules.** ESM (`.mjs`) and CJS (`.cjs`,
  `.js`) AppModules both work. Path is resolved through `pathToFileURL` so Windows paths
  and ESM resolution are correct.
- **`pristine.config.ts` is the canonical config location.** `pristine.appModule.cjsPath`
  in `package.json` still works but emits a deprecation warning.
- **Convention-based AppModule discovery.** Greenfield projects with `dist/app.module.js`
  need zero configuration.
- **Multi-candidate detection with TTY prompt / non-TTY error.** When discovery turns up
  multiple equally-ranked AppModule candidates, the CLI either asks (in a terminal) or
  fails with an actionable error (in CI). Selections are cached so re-runs skip the prompt.
- **Resilient bootstrap.** A broken AppModule path no longer prevents built-in commands
  from running — the CLI prints the error and falls back to `CliModule`-only mode so you
  can still run `pristine p:config:init` to fix things.
- **`p:config:init`** generates a starter `pristine.config.ts` and migrates from
  `package.json` automatically.
- **`p:config:print`** prints the resolved config and where it was loaded from.
- **`p:verify`** runs a fresh kernel boot of your AppModule, captures per-phase results,
  and runs every registered `InstantiationTestInterface`. Exits non-zero on failure for
  CI use.
- **The bin is bundled** (esbuild, single file) but with all `@pristine-ts/*` packages
  marked external — see *Architecture & cross-realm safety* above for why.
- **Bundled bin is published with the executable bit set.** A previous bug shipped the
  bin without `0o755`, breaking `node_modules/.bin/pristine` symlinks on first install
  for some users.
