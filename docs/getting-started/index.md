<p>
   <strong>Previous: </strong> <a href="../../README.md">Readme</a>
</p>

# Getting Started

Pristine is a TypeScript framework for Node.js. It gives you the pieces you'd expect —
dependency injection, modules, routing, configuration, auth, logging, tracing — and not
much else. The deliberate scope is "the things every backend ends up needing, with
predictable wiring," not "the largest possible feature set." Read on if that resonates;
look elsewhere if you want batteries-included scaffolding for every domain.

## What you'll find here

This guide is a tutorial, not a reference. Chapters build on each other. Code examples
work — they're drawn from a small carry-through demo (`demo/projects/catalog`) you can
read alongside the prose. For the symbol-level surface (every decorator, every method
signature), see the [API reference](13-reference/00.index.md) at the end.

The framework has opinions, and they're stated explicitly:

- **Per-event isolation**. Every event (HTTP request, queue message, scheduled command)
  gets its own DI child container and its own propagated context. Parallel events don't
  share state.
- **Crash isolation**. A misbehaving logger or tracer writes to stderr and the request
  keeps going. Tracing must never throw.
- **Module boundaries matter**. Each package owns its concerns; you don't pay for what
  you don't import.
- **Few dependencies**. We use `tsyringe` for DI and `reflect-metadata` for decorator
  metadata. That's the foundation; everything else is built in-house.

If those choices align with how you'd build a backend yourself, you'll likely find the
rest of the framework predictable. If you'd prefer convention-over-configuration with
heavy auto-wiring, Pristine will feel underpowered.

## How to read this guide

The chapters are ordered to teach the framework, not to mirror file structure. Three
tracks, depending on how you read:

**Tutorial track — the linear path.** Start here if you've never used Pristine. By the
end of chapter 11 you'll have a running app you can keep extending.

1. [Quick start](10-quick-start/00.index.md) — `npm install` to a running HTTP server in five minutes.
2. [The Pristine CLI](11-cli/00.index.md) — `pristine init`, `build`, `start`, `verify`, custom commands, plugins.
3. [Overview](01-overview/00.index.md) — kernel, DI, decorators. What makes the framework tick.
4. [Modules](05-modules/00.index.md) — composing an app from reusable pieces.
5. [Controllers](03-controllers/00.index.md) — HTTP requests, routes, validation, the request lifecycle.

**Reference track — chapters to come back to.** Read on demand. Each one is self-contained.

6. [Configuration](04-configuration/00.index.md) — declaring and resolving config values.
7. [Events](02-events/00.index.md) — listeners, interceptors, the event pipeline.
8. [Authentication](06-authentication/00.index.md) — identity providers, JWT, OAuth2.
9. [Authorization](08-authorization/00.index.md) — voters, permissions.
10. [Logging](07-logging/00.index.md) — the log handler, loggers, transports, crash isolation.
11. [Telemetry](09-telemetry/00.index.md) — traces, spans, tracers, `@traced`, contexts.

**Operations track — when you're ready to ship.**

12. [Production](12-production/00.index.md) — deployment patterns, graceful shutdown, health checks.
13. [API reference](13-reference/00.index.md) — auto-generated decorator + class reference.

## A few things worth knowing upfront

- The CLI is a real workflow tool. `pristine init` scaffolds a project. `pristine build`
  compiles + writes a freshness manifest. `pristine start` is the production entry
  point (signal handling, graceful shutdown). `pristine verify` runs your custom
  instantiation tests in CI. See [chapter 11](11-cli/00.index.md).
- Pristine propagates `eventId`, `traceId`, and (in HTTP flows) `request` + `identity`
  implicitly via `AsyncLocalStorage`. Your code doesn't have to thread them through
  every method. The mechanism is covered in the Overview chapter:
  [Contexts](01-overview/06.contexts.md).
- We don't run on edge runtimes. Pristine uses Node-specific APIs (`process`, signals,
  `async_hooks`). Cloudflare Workers, Deno isolates, and similar V8-only environments
  aren't supported. For Lambda / Express / Cloudflare bindings, see the relevant
  `@pristine-ts/aws-*` and `@pristine-ts/express` packages.

---

<p align="right">
   <strong>Start here: </strong> <a href="10-quick-start/00.index.md">Quick start</a>
</p>
