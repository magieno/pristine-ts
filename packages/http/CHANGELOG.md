# Changelog — @pristine-ts/http

## 4.0.3

- **Config-driven CORS + preflight support in `KernelHttpServer`.** A browser-facing Pristine
  server can now handle CORS entirely from configuration — no adapter or middleware. A new
  `CorsRequestHandler` collaborator is consulted inside `KernelHttpServer.handleRequest`, *before*
  `kernel.handle()`, so it can answer an `OPTIONS` preflight (`204`, short-circuited before routing)
  and reject a bad `Host` without the networking `Router` ever running.

  New optional keys under `pristine.http.cors.*` (see `HttpConfigurationKeys`):
  `allowed-origins` (exact-match allowlist; array or comma string), `allowed-methods`
  (default `GET,POST,PUT,DELETE,PATCH,OPTIONS`), `allowed-headers` (default `Content-Type`),
  `exposed-headers`, `max-age` (default `600`), `allow-credentials` (default `false`),
  `allow-private-network` (Chrome Private Network Access; default `false`), and `allowed-hosts`
  (optional `Host` allowlist → `403` before routing, a loopback DNS-rebinding defense).

  **CORS is inactive unless configured** — a server with no `cors.*` config behaves exactly as
  before. `Access-Control-Allow-Origin` is echoed (never `*`, never an arbitrary reflected origin)
  on both success and error (4xx/5xx) responses for allow-listed origins, so the browser can read
  error bodies.

## 3.0.5

- **`HttpModule` no longer imports `CliModule`.** It now imports only the framework modules it
  genuinely uses (`Core`, `DataMapping`, `Logging`, `Observability`, `Validation`), dropping the
  entire `@pristine-ts/cli` package (all CLI commands, the REPL, terminal/readline machinery, the
  build/plugin bootstrap, and CLI-only config keys) from HTTP/Lambda apps and consumer ESM bundles.
  The runtime service graph is otherwise unchanged, and HttpModule's `file-server:start` command
  still works under `pristine` (the CLI bin wraps the AppModule with `CliModule`).

  These direct dependencies are now declared in `package.json` (they were previously reaching
  `HttpModule` transitively through `CliModule`).

  `FileServerCommand` keeps implementing `CommandInterface` from `@pristine-ts/cli` as a **type-only**
  import, so no CLI runtime is pulled into HTTP bundles.

### Migration note

- **Console logging default changed from `Pretty` to `Json` for HTTP/Lambda apps.** The `Pretty`
  output mode HTTP apps used to see came from `CliModule`'s `configDefaults` leaking in via the old
  transitive import. HTTP apps now use `LoggingModule`'s own default (`Json`, structured). To keep
  pretty logging, set `pristine.logging.consoleLoggerOutputMode = "pretty"` in `pristine.config.ts`
  (or `PRISTINE_LOGGING_CONSOLE_LOGGER_OUTPUT_MODE=pretty`). Severity is unchanged (`Info`).
