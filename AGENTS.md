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

### Documentation (`docs/`)
*   Structure mirrors the framework's modularity.
*   `getting-started/` contains the primary learning path.

---
**Note:** This file is a living document for agents. Update it as you discover new patterns or requirements.