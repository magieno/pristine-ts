export enum RequestInterceptorPriorityEnum {
  // This should probably be one of the first interceptors
  BodyConverter = 1000,

  BodyMapping = 900,

  DefaultContentTypeResponseHeader = 800,

  Default = 0,
}