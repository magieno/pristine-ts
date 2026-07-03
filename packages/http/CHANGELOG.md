# Changelog — @pristine-ts/http

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
