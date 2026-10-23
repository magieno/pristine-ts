export enum RequestInterceptorPriorityEnum {
  // Runs first, so the logs of every other interceptor carry the caller's trace id.
  TracePropagation = 1100,

  // This should probably be one of the first interceptors
  BodyConverter = 1000,

  BodyMapping = 900,

  DefaultContentTypeResponseHeader = 800,

  Default = 0,
}