# `@pristine-ts/cli`

The Pristine CLI — a `pristine` binary for your project, plus everything you need to add
your own commands, build and start your app, and verify that your AppModule is healthy.

If you've used `ng`, `nest`, or `vite`, this is the equivalent for Pristine apps.

---

## Table of contents

- [Install](#install)
- [A 5-minute tour](#a-5-minute-tour)
- [Recipes](#recipes)
  - [Add a command to your app](#recipe-add-a-command-to-your-app)
  - [Build your TypeScript](#recipe-build-your-typescript)
  - [Start your app in production](#recipe-start-your-app-in-production)
  - [Host an HTTP (or HTTPS) server](#recipe-host-an-http-or-https-server)
  - [Verify your AppModule on every CI run](#recipe-verify-your-appmodule-on-every-ci-run)
  - [Pull commands in from a separate package (plugins)](#recipe-pull-commands-in-from-a-separate-package-plugins)
- [Configuration reference](#configuration-reference)
- [How `pristine` finds your AppModule](#how-pristine-finds-your-appmodule)
- [Built-in commands](#built-in-commands)
- [Production deployment](#production-deployment)
- [Architecture & design notes](#architecture--design-notes)
- [Migrating from older versions](#migrating-from-older-versions)
- [What changed](#what-changed-versus-pre-10440)

---

## Install

You have two good options. Pick the one that matches how you'll invoke the CLI.

### Option A — Local install (recommended for project-bound usage)

```sh
npm install --save-dev @pristine-ts/cli
```

Use it from your `package.json` scripts — no `npx` needed because npm puts
`node_modules/.bin/` on PATH for `npm run` invocations:

```json
{
  "scripts": {
    "build": "pristine build",
    "start": "pristine start",
    "verify": "pristine verify"
  }
}
```

```sh
npm run build
npm run start
```

For one-off invocations from the terminal, use `npx pristine ...`.

### Option B — Global install (if you want bare `pristine` in any terminal)

```sh
npm install -g @pristine-ts/cli
pristine list   # works in any directory
```

The bin is self-contained, so the global install pulls everything it needs and `pristine`
becomes available everywhere. This is the Angular/Nest/Vue CLI pattern.

> **Tip**: if you want bare `pristine` in your terminal **without** a global install, add
> `./node_modules/.bin` to your shell PATH per-project. `direnv` works well:
> create a `.envrc` with `PATH_add node_modules/.bin`, run `direnv allow`, done.

---

## A 5-minute tour

Let's walk through what the CLI looks like in practice. Assume you have a brand-new
project with just `package.json` and `tsconfig.json`.

### 1. Install the CLI

```sh
npm install --save-dev @pristine-ts/cli
```

### 2. Run `pristine init`

```sh
npx pristine init
```

`pristine init` is the canonical setup command. It interactively (or via flags in CI):

- Asks where your AppModule source file lives (default: `src/app.module.ts`)
- Asks where the compiled output should land (default: `dist/app.module.js`)
- Asks which tsconfig to use (default: `tsconfig.json`) and build format (default: `esm`)
- Writes `pristine.config.ts` with both `sourcePath` AND `outputPath` populated
- Optionally scaffolds a starter AppModule at the source path (only if it doesn't exist)
- Optionally adds `build`/`start`/`verify` scripts to your `package.json` (only ones that
  don't already exist — never overwritten)
- Adds `.pristine/` to your `.gitignore` if one is present

The generated config:

```ts
import {defineConfig} from "@pristine-ts/cli";

export default defineConfig({
  appModule: {
    sourcePath: "src/app.module.ts",
    outputPath: "dist/app.module.js",
  },
  build: {
    tsconfig: "tsconfig.json",
    format: "esm",
  },
});
```

For non-interactive use:

```sh
pristine init \
  --source-path=src/app.module.ts \
  --output-path=dist/app.module.js \
  --tsconfig=tsconfig.json \
  --format=esm \
  --scaffold \
  --scripts
```

### 3. Build your project

```sh
npx pristine build
```

`pristine build` runs `tsc` for you and produces `dist/`.

### 4. See what's loaded

```sh
npx pristine info
```

Output looks like:

```
Pristine CLI
  Version:        1.0.440
  Node:           v22.18.0
  Platform:       darwin arm64 (24.6.0)
  CWD:            /Users/you/projects/my-app

Configuration
  Config file:    /Users/you/projects/my-app/pristine.config.ts
  AppModule path: dist/app.module.js  (from config file)

AppModule: my-app
Imported modules (5):
  - my-app
  - pristine.cli
  - pristine.common
  - pristine.core
  - pristine.logging
```

### 5. Verify your AppModule boots cleanly

```sh
npx pristine verify
```

This actually starts a kernel from your AppModule, captures every phase outcome (module
registration, config load, after-init, etc.), runs every registered `InstantiationTest`,
and exits non-zero if anything fails. Drop it in CI to catch boot regressions before they
ship.

### 6. Run your app

```sh
npx pristine start
```

Boots your AppModule, registers SIGTERM/SIGINT handlers, keeps the process alive. If your
AppModule imports `@pristine-ts/http`, `pristine start` automatically launches an HTTP
server on `0.0.0.0:3000` (configurable). Send `SIGTERM` and watch graceful shutdown happen.

That's the whole loop. The rest of the README is recipes for specific things you'll want
to do, plus reference material when you need to look something up.

---

## Recipes

### Recipe: Add a command to your app

You want to type `pristine sync-products` and have your own code run.

**1. Write the command class.** It's an injectable class implementing `CommandInterface`,
decorated with `@tag(ServiceDefinitionTagEnum.Command)`:

```ts
// src/commands/sync-products.command.ts
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CommandInterface, ConsoleManager, ExitCodeEnum} from "@pristine-ts/cli";
import {AppModuleKeyname} from "../app.module.keyname";
import {ProductService} from "../services/product.service";

@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(AppModuleKeyname)
@injectable()
export class SyncProductsCommand implements CommandInterface<null> {
  optionsType = null;
  name = "sync-products";
  description = "Re-sync the local product cache from upstream.";

  constructor(
    private readonly consoleManager: ConsoleManager,
    private readonly productService: ProductService,
  ) {}

  async run(): Promise<ExitCodeEnum | number> {
    const count = await this.productService.syncAll();
    this.consoleManager.writeSuccess(`Synced ${count} products.`);
    return ExitCodeEnum.Success;
  }
}
```

**2. Make sure your AppModule imports it.** The simplest way: include it in your AppModule's
`importServices`:

```ts
// src/app.module.ts
import {AppModuleInterface} from "@pristine-ts/common";
import {CliModule} from "@pristine-ts/cli";
import {CoreModule} from "@pristine-ts/core";
import {SyncProductsCommand} from "./commands/sync-products.command";

export const AppModule: AppModuleInterface = {
  keyname: "my-app",
  importModules: [CoreModule, CliModule],
  importServices: [SyncProductsCommand],
};
```

**3. Build and run.**

```sh
npx pristine build
npx pristine sync-products
```

Output:

```
✔ Success: Synced 142 products.
[status:'Success', code:'0'] - Command 'sync-products' exited.
```

#### With typed CLI flags

Need `--limit=100 --dry-run`? Define an options class with `class-validator` decorators:

```ts
// src/commands/sync-products.command-options.ts
import "reflect-metadata";
import {IsBoolean, IsNumber, IsOptional} from "@pristine-ts/class-validator";

export class SyncProductsOptions {
  @IsOptional() @IsNumber() limit?: number;
  @IsOptional() @IsBoolean() "dry-run"?: boolean;
}
```

Then in the command, set `optionsType` to a fresh instance and read `args` in `run`:

```ts
@injectable()
export class SyncProductsCommand implements CommandInterface<SyncProductsOptions> {
  optionsType = new SyncProductsOptions();
  name = "sync-products";
  description = "Re-sync the local product cache from upstream.";

  async run(args: SyncProductsOptions): Promise<ExitCodeEnum | number> {
    const limit = args.limit ?? Infinity;
    const dryRun = args["dry-run"] === true;
    // ...
  }
}
```

`npx pristine sync-products --limit=50 --dry-run` parses, validates, and passes the typed
options into `run`. Validation failures exit non-zero and print the constraint errors.

---

### Recipe: Build your TypeScript

`pristine build` is a `tsc` wrapper that ALSO writes a build manifest at
`.pristine/build-manifest.json` so downstream commands can detect when the build is
stale (source edited, output deleted, paths reconfigured).

For most projects, the only thing you need is the default config produced by `pristine init`:

```ts
// pristine.config.ts
import {defineConfig} from "@pristine-ts/cli";

export default defineConfig({
  appModule: {path: "dist/app.module.js"},
  build: {
    outDir: "dist",
    tsconfig: "tsconfig.json",
    format: "esm",          // "esm" | "cjs" | "both"
    clean: true,            // wipe outDir before each build
  },
});
```

```sh
npx pristine build
```

#### Building both ESM and CJS

If you publish a library that needs both:

```ts
build: {
  format: "both",          // runs tsconfig.json then tsconfig.cjs.json sequentially
}
```

You need a `tsconfig.cjs.json` sibling that targets CommonJS. The CLI looks for it
automatically when format is `"both"` or `"cjs"`.

#### Custom tsconfig path

```ts
build: {
  tsconfig: "tsconfig.build.json",
}
```

#### The build manifest

After a successful build, `pristine build` writes
`<project>/.pristine/build-manifest.json`:

```json
{
  "appModuleSourcePath": "/abs/path/src/app.module.ts",
  "appModuleOutputPath": "/abs/path/dist/app.module.js",
  "sourceHash": "sha256:...",
  "builtAt": "2026-05-11T00:00:00.000Z"
}
```

Every command that loads your AppModule (`pristine start`, `pristine verify`, etc.) reads
this file to confirm the compiled output matches your current source. If the manifest is
**stale** (source edited since last build, output deleted, paths reconfigured), the CLI:

- **In a TTY**: prints what's stale and prompts: "Run `pristine build` now to refresh? [Y/n]".
  On Yes, runs the build inline and continues. On No, exits.
- **Non-TTY** (CI, Docker): prints the same explanation and exits non-zero. CI never
  auto-rebuilds — that hides bugs.

Examples of stale states and what they mean:

| Reason | What happened |
|--------|---------------|
| `Missing` | No manifest yet. Run `pristine build`. |
| `SourcePathChanged` | You edited `appModule.sourcePath` in the config. Rebuild. |
| `OutputPathChanged` | You edited `appModule.outputPath` in the config. Rebuild. |
| `SourceContentChanged` | The source file's bytes don't match the hash from the last build. Rebuild. |
| `OutputMissing` | The compiled file referenced by the manifest is no longer on disk. Rebuild. |

The manifest only ships when both `appModule.sourcePath` and `appModule.outputPath` are
configured (which `pristine init` does for you). Without them, `pristine build` still works
as a thin `tsc` wrapper but doesn't produce a manifest, and downstream commands skip the
staleness check.

---

### Recipe: Start your app in production

`pristine start` is a real production entry point — boots your AppModule, runs every
registered `RuntimeServer` (HTTP, etc.), handles SIGTERM/SIGINT with graceful shutdown.

#### The simplest case

```sh
npx pristine start
```

If your AppModule has no HTTP/queue/etc. modules imported, this just boots the kernel and
waits for a signal. Useful as a worker-style entry that consumes events through other
mechanisms (cron, CLI args, etc.).

#### With graceful shutdown

Add an `onShutdown` hook to your modules to release resources cleanly when the process
gets SIGTERM:

```ts
import {ModuleInterface} from "@pristine-ts/common";

export const DatabaseModule: ModuleInterface = {
  keyname: "my-app.database",
  // ... onInit, providerRegistrations, etc.
  onShutdown: async (container) => {
    const pool = container.resolve(DatabaseConnectionPool);
    await pool.drain();      // wait for in-flight queries
    await pool.close();      // release sockets
  },
};
```

When `pristine start` receives SIGTERM:
1. Signal handler fires.
2. `Kernel.stop()` walks every imported module's `onShutdown` in outer-to-inner order
   (your AppModule first, leaf dependencies last) so a higher-level module can still call
   into its dependencies during teardown.
3. Each hook gets a 10-second timeout. Misbehaving hooks log a warning and shutdown
   continues.
4. After all hooks complete, the process exits 0.
5. If shutdown takes longer than 30 seconds total, the process is force-killed (so
   Kubernetes / ECS / systemd are never stuck waiting).

A second SIGTERM/SIGINT during shutdown bypasses the rest of the wait and exits
immediately with code 130.

#### In a Dockerfile

```dockerfile
FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
RUN npm install -g @pristine-ts/cli
COPY dist/ ./dist/
COPY pristine.config.js ./   # if your config file is .ts, compile it or use .js
CMD ["pristine", "start"]
```

`pristine start` is the canonical container entry. If you'd rather use bare Node, that
also works: `CMD ["node", "dist/main.js"]`. Both are supported; `pristine start` adds
graceful-shutdown wiring you'd otherwise have to write yourself.

---

### Recipe: Host an HTTP (or HTTPS) server

If your AppModule imports `@pristine-ts/http`, `pristine start` automatically launches the
built-in `KernelHttpServer`. Every incoming request goes through `kernel.handle()` →
the `@pristine-ts/networking` `Router` → your controllers. No glue code needed.

**1. Set up the AppModule.**

```ts
// src/app.module.ts
import {AppModuleInterface} from "@pristine-ts/common";
import {CoreModule} from "@pristine-ts/core";
import {HttpModule} from "@pristine-ts/http";
import {NetworkingModule} from "@pristine-ts/networking";
import {DogsController} from "./controllers/dogs.controller";

export const AppModule: AppModuleInterface = {
  keyname: "my-app",
  importModules: [CoreModule, HttpModule, NetworkingModule],
  importServices: [DogsController],
};
```

**2. Write a controller.** Standard Pristine — nothing CLI-specific:

```ts
// src/controllers/dogs.controller.ts
import {injectable} from "tsyringe";
import {controller, HttpMethod, route} from "@pristine-ts/networking";

@injectable()
@controller("/dogs")
export class DogsController {
  @route(HttpMethod.Get, "")
  list() {
    return [{name: "Peach"}, {name: "Banjo"}];
  }
}
```

**3. Build and start.**

```sh
npx pristine build
npx pristine start
# Pristine app running with 1 server(s): http. Send SIGTERM (or Ctrl+C) to stop.

curl http://localhost:3000/dogs
# [{"name":"Peach"},{"name":"Banjo"}]
```

#### Customizing port and address

Three layers, highest priority first. Use whichever fits.

```sh
# CLI flag — one-off override
npx pristine start --port=4000 --address=127.0.0.1
```

```ts
// Config file — project-level default
export default defineConfig({
  appModule: {path: "dist/app.module.js"},
  kernelConfiguration: {
    "pristine.http.kernel-server.port": 4000,
    "pristine.http.kernel-server.address": "127.0.0.1",
  },
});
```

```sh
# Environment variable — deploy-time override
PRISTINE_HTTP_KERNEL_SERVER_PORT=4000 \
PRISTINE_HTTP_KERNEL_SERVER_ADDRESS=0.0.0.0 \
  pristine start
```

Defaults: `0.0.0.0:3000`.

#### Switching to HTTPS

Set the TLS key and cert paths and the server flips from `http.Server` to `https.Server`
automatically:

```sh
PRISTINE_HTTP_KERNEL_SERVER_TLS_KEY_PATH=/etc/ssl/key.pem \
PRISTINE_HTTP_KERNEL_SERVER_TLS_CERT_PATH=/etc/ssl/cert.pem \
  pristine start
# KernelHttpServer: listening on https://0.0.0.0:3000
```

Or via config:

```ts
kernelConfiguration: {
  "pristine.http.kernel-server.tls.key-path": "/etc/ssl/key.pem",
  "pristine.http.kernel-server.tls.cert-path": "/etc/ssl/cert.pem",
}
```

When both paths are set to non-empty values, the server reads the PEM files at boot and
serves HTTPS. The `name` it reports flips from `"http"` to `"https"`.

#### Graceful drain

When SIGTERM hits, `KernelHttpServer.stop()` is called via `HttpModule.onShutdown` — it
calls `server.close()` (refuses new connections, lets in-flight requests finish), waits up
to 10 seconds for connection drain, then force-closes any remaining sockets. Matches what
container orchestrators expect during a rolling deploy.

#### Adding more server types

Any module can register a long-running server by implementing `RuntimeServerInterface`
and tagging it. `pristine start` discovers and launches it alongside the HTTP server:

```ts
@tag(ServiceDefinitionTagEnum.RuntimeServer)
@moduleScoped(MyModuleKeyname)
@injectable()
export class GrpcServer implements RuntimeServerInterface {
  name = "grpc";
  async start(overrides) { /* ... */ }
  async stop() { /* ... */ }
}
```

This is how future gRPC, websocket, or queue-listener modules will plug into `pristine
start` — no `@pristine-ts/cli` changes required.

---

### Recipe: Verify your AppModule on every CI run

`pristine verify` runs a fresh kernel boot of your AppModule on a throw-away kernel,
captures per-phase outcomes (module registration, config check/load, after-init, etc.),
and runs every registered `InstantiationTestInterface`. Returns non-zero if anything
fails. Perfect for CI.

#### In your CI pipeline

```yaml
# .github/workflows/ci.yml
- run: npm ci
- run: npm run build
- run: npx pristine verify
```

#### Adding your own boot-time health checks

Want CI to fail if your DB credentials are wrong? Implement `InstantiationTestInterface`:

```ts
// src/health/database-connectivity.test.ts
import {tag, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {injectable, DependencyContainer} from "tsyringe";
import {InstantiationTestInterface, InstantiationTestResultInterface} from "@pristine-ts/core";
import {DatabaseClient} from "../database/database.client";

@tag(ServiceDefinitionTagEnum.InstantiationTest)
@injectable()
export class DatabaseConnectivityTest implements InstantiationTestInterface {
  name = "database connectivity";
  description = "Pings the database to confirm credentials and network reachability.";

  async run(container: DependencyContainer): Promise<InstantiationTestResultInterface> {
    try {
      await container.resolve(DatabaseClient).ping();
      return {passed: true};
    } catch (e) {
      return {passed: false, message: (e as Error).message};
    }
  }
}
```

Register it the same way you would any service (via `importServices` or by `@tag`
self-registration). `pristine verify` will discover and run it automatically.

To skip the health-test phase (and only verify the boot phases):

```sh
npx pristine verify --skip-tests
```

---

### Recipe: Pull commands in from a separate package (plugins)

Custom commands can live in their own npm package. Useful for tooling-only commands
(generators, codemods, linters) you don't want loaded into your runtime AppModule.

**Plugin author** publishes a package that exports one or more `*Module` symbols:

```ts
// my-plugin/src/index.ts
import {ModuleInterface} from "@pristine-ts/common";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
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
  // No providerRegistrations needed — the @tag decorator self-registers HelloCommand
  // as soon as the file is imported (which happens when this module is loaded).
};
```

**Consumer** installs and declares it:

```sh
npm install --save-dev my-plugin
```

```ts
// pristine.config.ts
import {defineConfig} from "@pristine-ts/cli";

export default defineConfig({
  appModule: {path: "dist/app.module.js"},
  plugins: [
    "my-plugin",
    // Or: {name: "@my-org/codegen", options: {/* reserved for future use */}},
  ],
});
```

```sh
npx pristine my-plugin:hello
# Hello!
```

Plugins are resolved from the **consumer's** `node_modules` (via `createRequire` anchored
at the config file's location), so monorepos with hoisted deps work out of the box.

#### Failure modes

- Missing plugin → clear stderr error, CLI continues without it (built-in commands like
  `pristine p:config:print` still work for debugging).
- Plugin exports no `*Module` symbols → loud error (silent loading is a footgun).
- Two commands collide on `name` → stderr warning at boot listing the count, first
  registered match dispatches. Rename one to fix.

#### Diagnostics

`pristine info` lists every loaded plugin under a dedicated `Plugins (N)` section.

---

## Configuration reference

The canonical config file is **`pristine.config.ts`** at your project root.

```ts
import {defineConfig} from "@pristine-ts/cli";

export default defineConfig({
  appModule: {
    path: "dist/app.module.js",     // required for non-trivial setups
    export: "AppModule",             // default; override only for unusual setups
  },

  build: {
    outDir: "dist",                  // tsc's outDir is what actually controls output
    tsconfig: "tsconfig.json",
    format: "esm",                   // "esm" | "cjs" | "both"
    clean: false,                    // wipe outDir before each build
  },

  start: {
    // Reserved for upcoming features (entry, watch, nodeArgs).
  },

  plugins: [
    "my-plugin",
    {name: "@my-org/codegen"},
  ],

  kernelConfiguration: {
    // Any configuration value your modules expect — these are passed through to
    // `kernel.start(appModule, kernelConfiguration)` so they take effect during boot.
    "pristine.http.kernel-server.port": 4000,
    "pristine.logging.logSeverityLevelConfiguration": 1,
  },
});
```

All fields are optional. The CLI applies sensible defaults wherever a field is absent.

### Supported file formats

The CLI looks for these names in order, walking **up** from `process.cwd()` until it
finds a match (so a CLI invocation from `packages/foo/` in a monorepo finds the root
config):

1. `pristine.config.ts` — recommended; full IDE autocomplete via `defineConfig`
2. `pristine.config.mts`
3. `pristine.config.cts`
4. `pristine.config.js`
5. `pristine.config.mjs`
6. `pristine.config.cjs`

`.ts` configs load at runtime via `jiti` — no separate compile step needed.

### Inspecting the resolved config

```sh
npx pristine p:config:print
```

Prints the loaded config as JSON, plus the file path it came from and per-field
provenance markers. Use this when discovery is doing something unexpected.

---

## How `pristine` finds your AppModule

When the CLI starts, it walks this cascade. The first match wins.

```
1. pristine.config.ts → appModule.path
        ↓ (not set?)
2. package.json → pristine.appModule.path
        ↓ (deprecated alias: pristine.appModule.cjsPath, prints warning)
        ↓ (not set?)
3. .pristine/last-app-module        ← cached selection from a previous TTY prompt
        ↓ (not set?)
4. Convention scan: dist/, dist/lib/cjs/, dist/lib/esm/, build/, .
   for *.module.{js,mjs,cjs}
        ├── named app.module.* → score 0
        └── exports an AppModule symbol → score 10
   ── one match? → use it
   ── multiple equally-ranked + TTY? → prompt
   ── multiple equally-ranked + no TTY? → exit with actionable error
        ↓ (no candidates?)
5. Legacy node_modules/@pristine-ts/* scan (synthetic AppModule)
        ↓ (still nothing?)
6. Built-in CliModule fallback (so p:help etc. always work)
```

If a configured AppModule path can't be loaded (file missing, import error), the CLI
warns to stderr and falls back to the CliModule fallback. Built-in commands like
`pristine p:config:print` still work so you can debug.

### Module formats

The loader accepts:

| Extension | Loaded as | Example |
|-----------|-----------|---------|
| `.js` (CJS) | CommonJS | tsc's default output |
| `.cjs` | CommonJS (explicit) | |
| `.mjs` | ESM | |
| `.js` in a `"type": "module"` package | ESM (via package context) | |

All loaded via Node's real dynamic `import()` (with `pathToFileURL` for absolute paths).

---

## Built-in commands

Every framework-reserved command has a canonical `p:`-prefixed name and a top-level
alias. Use whichever you prefer.

| Command | Alias | What it does |
|---------|-------|--------------|
| `pristine p:init` | `init` | Scaffold a new project setup interactively (or via flags). Writes `pristine.config.ts`, optional starter AppModule, optional npm scripts. Refuses to overwrite an existing config. |
| `pristine p:help` | `help` | Print usage and list every registered command (built-in + custom) with descriptions. |
| `pristine p:list` | `list` | Print every registered command name (compact form). |
| `pristine p:info` | `info` | Print framework version, Node, OS, resolved config path, AppModule location, imported module list. Useful for support tickets. |
| `pristine p:build` | `build` | Compile your TypeScript via `tsc` and write the build manifest. Reads `build.{outDir,tsconfig,format,clean}` and `appModule.{sourcePath,outputPath}` from config. |
| `pristine p:start` | `start` | Boot the AppModule and run until SIGTERM/SIGINT. Auto-starts every registered `RuntimeServer` (HTTP, etc.). Production-grade. Supports `--port` / `--address`. Prompts to rebuild if the manifest is stale. |
| `pristine p:verify` | `verify` | Boot a fresh kernel of your AppModule, run all registered `InstantiationTest`s. Exits non-zero on failure. `--skip-tests` skips the test phase. |
| `pristine p:config:init` | — | Legacy helper that migrates a `pristine.appModule.{path,cjsPath}` field from `package.json` to a minimal config file. Prefer `pristine init` for new projects. |
| `pristine p:config:print` | — | Print the resolved config + file path it loaded from + per-field provenance. |

`config:*` commands intentionally don't have top-level aliases — they're sub-commands by
design.

---

## Production deployment

You have two equally supported entry points.

### Option A — `node dist/main.js`

Traditional. Your `dist/main.js` is the entry. No `@pristine-ts/cli` needed in the deploy
unit. Lifecycle, signal handling, and graceful shutdown are your responsibility.

### Option B — `pristine start`

`pristine start` is itself a production-grade entry. It boots your AppModule, starts every
registered `RuntimeServer` (HTTP server, etc.), handles SIGTERM/SIGINT with graceful
shutdown, enforces a hard-exit timeout, and keeps the event loop alive on its own.

Install once on the host:

```sh
npm install -g @pristine-ts/cli
```

Then in your Dockerfile / systemd unit / process manager:

```sh
pristine start
```

If `@pristine-ts/http` is in your AppModule, an HTTP server is launched automatically.
Configure port/address/TLS via env vars (see [HTTP recipe](#recipe-host-an-http-or-https-server)).

---

## Architecture & design notes

The `pristine` bin file is a thin shim:

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

Side effect: `reflect-metadata`, `tsyringe`, and `class-transformer` are NOT declared as
direct dependencies of `@pristine-ts/cli`. They come transitively through
`@pristine-ts/common` (which every Pristine package depends on). Declaring them directly
would cause npm to install duplicate copies in `packages/cli/node_modules/`, and
`reflect-metadata` in particular keeps its decorator WeakMap inside the module closure —
two copies = two WeakMaps = silently lost metadata.

The bin itself is bundled with `esbuild` for fast startup, but with all `@pristine-ts/*`
packages marked external so the cross-realm trap doesn't reappear.

---

## Migrating from older versions

### From the `package.json` `pristine.appModule.cjsPath` field

The old setup required:

```json
{
  "pristine": {
    "appModule": { "cjsPath": "dist/lib/cjs/app.module.js" }
  }
}
```

Both `pristine.appModule.cjsPath` (deprecated, prints warning) and `pristine.appModule.path`
(new, format-agnostic) still work for one minor version cycle. To migrate cleanly:

```sh
npx pristine p:config:init
```

The command detects the existing `pristine.appModule.{path,cjsPath}` field, generates a
`pristine.config.ts` with the path migrated, and tells you to delete the `pristine` field
from `package.json`.

### From manual bootstrap in `main.ts`

If your old setup looked like:

```ts
// main.ts (old)
import {Kernel} from "@pristine-ts/core";
import http from "http";
import {AppModule} from "./app.module";

const kernel = new Kernel();
await kernel.start(AppModule);

http.createServer(async (req, res) => {
  // ... wire req → kernel.handle → res
}).listen(3000);
```

You can drop all of that and just use `pristine start`. Make sure `@pristine-ts/http` is
in your AppModule's `importModules` and the server starts automatically with the same
routing pipeline (no behavior changes).

---

## What changed (versus pre-1.0.440)

**Phase 7 (this release):**

- **`pristine init` command.** Interactive (or flag-driven) scaffold: writes
  `pristine.config.ts` with both `sourcePath` and `outputPath`, optionally creates a starter
  AppModule, optionally adds `build`/`start`/`verify` scripts to `package.json`, optionally
  adds `.pristine/` to `.gitignore`. Never overwrites existing files.
- **Explicit source + output paths in config.** `appModule.path` deprecated;
  `appModule.sourcePath` (what `pristine build` compiles) and `appModule.outputPath`
  (what runtime commands load) replace it. Old `path` field still works for one minor
  cycle with a warning.
- **Build manifest at `.pristine/build-manifest.json`.** Written atomically by
  `pristine build` after successful compile. Records source path, output path, source
  content hash, build timestamp.
- **Staleness detection.** `pristine start`/`verify`/etc. read the manifest before loading
  the AppModule. Stale manifests (source edited, output missing, paths reconfigured) are
  detected and surfaced with a specific reason. In a TTY, the user is prompted to rebuild
  inline; in CI, the bin exits non-zero with the explanation.
- **Legacy `path` field still works.** With a deprecation warning pointing users at
  `pristine init` for migration.

**Phase 6:**

- **End-to-end smoke tests for the bin.** `tests/cli` exercises every command via the
  actual built `pristine` binary spawned by jest.
- **`pristine.config.ts` migration in `tests/cli`.** The old `package.json`
  `pristine.appModule.cjsPath` field was removed in favor of a real `pristine.config.ts`.
- **CI runs the e2e suite.** `npm run e2e` invokes `tests/cli`'s suite alongside
  `tests/e2e`.

**Phase 5:**

- **Plugin discovery via `pristine.config.ts`'s `plugins` array.** Tooling-only command
  packages can be opted into without polluting the runtime AppModule.
- **Plugin failure is non-fatal.** A missing or broken plugin warns to stderr and the CLI
  continues with built-in commands intact.
- **`pristine info` lists loaded plugins.**
- **Command-name collisions warn loudly** at boot.

**Phase 4:**

- **`pristine start` hosts HTTP servers automatically** when `@pristine-ts/http` is
  imported. HTTPS support via TLS file paths. CLI flag overrides for `--port` / `--address`.
- **`pristine start` is a real production entry point.** SIGTERM/SIGINT → graceful
  `Kernel.stop()` → `onShutdown` hooks → exit. Hard-exit timeout protection.
- **`RuntimeServerInterface`** added so any module can plug a long-running server into
  `pristine start`.
- **`pristine info`** prints framework + runtime metadata + the imported module graph.
- **`pristine build`** wraps `tsc`. Format `"both"` runs ESM and CJS sequentially.
- **`pristine help`** is generated from the live command registry.
- **Top-level aliases** (`pristine help`, `list`, `verify`, `info`, `build`, `start`).
- **`CommandInterface.description`** added (optional one-line summary).

**Phase 3:**

- **`pristine.config.ts` is the canonical config location.** Loaded via `jiti` — no
  separate compile step.
- **`p:config:init`** generates a starter config and migrates from `package.json`.
- **`p:config:print`** prints the resolved config with provenance markers.
- **Deprecation warning** on `pristine.appModule.cjsPath` in `package.json`.

**Phase 2:**

- **ESM (`.mjs`) AppModules supported.** Path resolved through `pathToFileURL` so Windows
  paths and ESM resolution are correct.
- **Convention-based AppModule discovery.** Greenfield projects with `dist/app.module.js`
  need zero configuration.
- **Multi-candidate detection with TTY prompt / non-TTY error.** Selections are cached so
  re-runs skip the prompt.
- **Resilient bootstrap.** A broken AppModule path no longer prevents built-in commands
  from running.

**Phase 1:**

- **The bin is bundled** (esbuild, single file) but with all `@pristine-ts/*` packages
  marked external (cross-realm safety — see [Architecture](#architecture--design-notes)).
- **Bundled bin is published with the executable bit set.**
