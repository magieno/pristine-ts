/**
 * This enum is for the different span names that are integrated in Pristine.
 */
export enum SpanKeynameEnum {
  ChildContainerCreation = "child.container.creation",
  ChildContainerRegistration = "child.container.registration",
  ConfigurationInitialization = "configuration.initialization",
  ErrorResponseInterceptors = "error.response.interceptors",
  EventDispatcherResolver = "event.dispatcher.resolver",
  EventExecution = "event.execution",
  EventInitialization = "event.initialization",
  EventPreMappingInterception = "event.pre-mapping.interception",
  EventPostMappingInterception = "event.post-mapping.interception",
  EventPreResponseMappingInterception = "event.pre-response-mapping.interception",
  EventPostResponseMappingInterception = "event.post-response-mapping.interception",
  EventMapping = "event.mapping",
  KernelInitialization = "kernel.initialization",
  ModuleInitialization = "module.initialization",
  ModuleInitializationImportModules = "module.initialization.import.modules",
  RequestExecution = "request.execution",
  RequestInterceptors = "request.interceptors",
  ResponseInterceptors = "response.interceptors",
  RootExecution = "root.execution",
  RouterControllerResolver = "router.controller.resolver",
  RouterFindMethodRouterNode = "router.find.method.router.node",
  RouterRequestAuthentication = "router.request.authentication",
  RouterRequestExecution = "router.request.execution",
  RouterSetup = "router.setup",
}
