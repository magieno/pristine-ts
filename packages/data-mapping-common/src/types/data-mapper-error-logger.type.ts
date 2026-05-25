/**
 * Callback the DataMapper invokes when `autoMap` swallows an error and `logErrors: true` is set.
 *
 * Defined as a plain function type so `data-mapping-common` stays free of a logging-framework
 * dependency. The DI-wired `DataMapper` in `@pristine-ts/data-mapping` adapts a
 * `LogHandlerInterface` into this callback; non-DI / frontend callers can pass their own (or
 * leave it unset to suppress logging entirely).
 */
export type DataMapperErrorLogger = (
  error: Error,
  context: { source: unknown, destinationType: unknown },
) => void;
