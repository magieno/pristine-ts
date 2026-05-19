/**
 * Error-code catalog owned by `@pristine-ts/core`. Surfaced via `PristineErrorOptions.code`
 * (typed `PristineErrorCode | string`, so any enum value is accepted).
 *
 * Codes here belong to the framework's event pipeline — they describe failures in
 * mapping, dispatch, and interceptor execution. Add a new entry when introducing a
 * new failure point in the pipeline; reuse an existing entry when the same root cause
 * surfaces from multiple call sites.
 */
export enum CoreErrorCode {
  EventMappingFailed                = "EVENT_MAPPING_FAILED",
  EventNoMapperSupports             = "EVENT_NO_MAPPER_SUPPORTS",
  EventNoEvents                     = "EVENT_NO_EVENTS",
  EventPreMappingInterceptorFailed  = "EVENT_PRE_MAPPING_INTERCEPTOR_FAILED",
  EventPostMappingInterceptorFailed = "EVENT_POST_MAPPING_INTERCEPTOR_FAILED",
  EventPreResponseInterceptorFailed = "EVENT_PRE_RESPONSE_INTERCEPTOR_FAILED",
  EventPostResponseInterceptorFailed = "EVENT_POST_RESPONSE_INTERCEPTOR_FAILED",
}
