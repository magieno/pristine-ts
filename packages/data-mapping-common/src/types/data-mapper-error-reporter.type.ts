/**
 * Callback the DataMapper invokes when `autoMap` swallows an error and `logErrors: true`
 * is set on the options.
 *
 * Defined as a plain function type so `data-mapping-common` stays free of a logging-framework
 * dependency — important because this package is consumed by frontend bundles (Angular, etc.)
 * where pulling `@pristine-ts/logging` and its transitive deps in would add weight for no
 * functional benefit.
 *
 * Wiring options:
 *   - Pass nothing to DataMapper → errors print via the built-in `ConsoleErrorReporter`.
 *   - Pass a custom reporter → errors go where you want them.
 *   - Pass `() => {}` (no-op) → errors are silently dropped even when `logErrors: true`.
 *
 * The DI-wired DataMapper in `@pristine-ts/data-mapping` provides an adapter that routes
 * into the framework's `LogHandlerInterface`.
 */
export type DataMapperErrorReporter = (
  error: Error,
  context: { source: unknown, destinationType: unknown },
) => void;
