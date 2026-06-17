# Core Profile: Pristine TS Agent

## 1. Project Overview
**Pristine TS** is a fast, lightweight, and modular `Typescript` framework for `NodeJS`, designed with a **"serverless-first" philosophy.**

Its primary mission is to provide a full-fledged enterprise-level framework with the **lowest possible minimal footprint**, specifically to solve the **"cold start" problem in FaaS** (Function as a Service) environments.

## 2. Core Philosophy & Architecture
The framework is completely decoupled from any specific `HTTP` server. The core is a lightweight **Event Pipeline**: `Map -> Intercept -> Handle -> Map Response`.

### Key Concepts:
*   **Kernel:** The application entry point and DI container wrapper.
*   **Modules:** Defined via `@Module()`, structuring the application into feature sets.
*   **Dependency Injection:** Inverted DI pattern using `@injectable()` and `@moduleScoped()`.
*   **Event-Driven:** Everything is an event. HTTP requests, SQS messages, and CLI commands are all normalized into `Event` objects.

## 3. Package Structure
The monorepo contains several packages under `packages/`. Key packages include:

*   **Core:** `@pristine-ts/core` (Kernel, DI), `@pristine-ts/common` (Interfaces, Enums).
*   **Networking:** `@pristine-ts/networking` (Controllers, Decorators), `@pristine-ts/validation` (Body Validation).
*   **Configuration:** `@pristine-ts/configuration` (Config Management).
*   **Security:** `@pristine-ts/security` (Guards, Authenticators).
*   **Integrations:** `@pristine-ts/aws`, `@pristine-ts/stripe`, `@pristine-ts/mysql`, etc.
*   **CLI:** `@pristine-ts/cli` (Command Line Interface).

## 4. Coding Style & Conventions
*   **Language:** TypeScript is mandatory.
*   **DI:** All services must be `@injectable()`. Use `@moduleScoped()` for isolation.
*   **Contracts:** Respect interfaces. `ConsoleManager` implies a contract for CLI interaction.
*   **No External Bloat:** Avoid adding heavy dependencies. Use native Node.js APIs where possible to maintain the "lightweight" goal.

## 5. How to Work in this Repo
1.  **Understand the Task:** Analyze the request and the relevant code.
2.  **Check Dependencies:** Verify `package.json` before using any library.
3.  **Implement:** specific changes, adhering to the "serverless/minimal" philosophy.
4.  **Verify:** Run tests `npm run test` and ensuring the build passes.

## 6. Specific Components Reference

### ConsoleManager (`@pristine-ts/cli`)
*   **Role:** Handles all interactions with the standard output/input for CLI commands.
*   **Requirement:** Must remain lightweight. Do not introduce heavy UI libraries like `inquirer` or `ora` unless absolutely necessary and approved. Implement features using native ANSI codes and `readline`.

### Command options & `@commandParameter` (`@pristine-ts/cli`)
*   A command's flags are declared as a class (its `optionsType`) decorated with `@pristine-ts/class-validator` rules. `CommandArgumentResolver` maps argv onto an instance and validates it before `run()`.
*   `@commandParameter({flag?, question?})` (property decorator) describes a single CLI parameter: `flag` rebinds it to a differently-named flag (default = the property name); `question` makes the CLI ask for it interactively when it's absent. Model a required-but-askable value as a normal **required** field carrying `@commandParameter({question})` — not as an optional field hand-checked inside `run()`.
*   Interactive prompting is gated by the `pristine.cli.interactiveParameters` configuration (default `true`) and is skipped automatically when stdin is not a TTY, so CI fails validation instead of hanging on a prompt.

### Documentation (`docs/`)
*   Structure mirrors the framework's modularity.
*   `getting-started/` contains the primary learning path.

## 7. Parallel git worktrees

Parallel tasks/agents use a **container layout**: a folder named after the repo holds the
clone in `master/` and each worktree as a **flat sibling** named after its task/branch (a
`/` in the branch becomes `-` in the dir name). `master/` is the anchor — it stays on
`master` and owns the installed `node_modules`; worktrees are disposable.

```
pristine-ts/                    <- container (named after the repo)
├── master/                     <- anchor checkout, stays on master
├── improve-logging/            <- worktree (branch improve-logging)
└── feature-x/                  <- worktree (branch feature/x)
```

Worktrees are the **recommended default** for parallel or substantial work; small one-off
branches can still be done in `master/`. The default base branch is always `master`.

**Create / remove:**

```
scripts/worktree-new.sh <task> [base]              # base defaults to master
scripts/worktree-rm.sh  <task> [--force] [--delete-branch]
```

**Provisioning:** dependencies are **isolated per worktree** — creation runs `npm ci` in
every dir with a `package.json` + `package-lock.json` (root first, so the root's
`file:packages/*` links resolve before the per-package installs); then build with
`npm run build`. Nothing else is shared from `master`: pristine-ts has no data dir, docker
stack, or local `.env` to link.

---
**Note:** This file is a living document for agents. Update it as you discover new patterns or requirements.