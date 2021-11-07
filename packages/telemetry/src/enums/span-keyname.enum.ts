export enum SpanKeynameEnum {
    RootExecution = "root.execution",
    KernelInitialization = "kernel.initialization",
    ConfigurationInitialization = "configuration.initialization",
    RequestExecution = "request.execution",
    RequestInterceptors = "request.interceptors",
    ResponseInterceptors = "response.interceptors",
    ErrorResponseInterceptors = "error.response.interceptors",
    EventInitialization = "event.initialization",
    EventExecution = "event.execution",
    ModuleInitialization = "module.initialization",
    ModuleInitializationImportModules = "module.initialization.import.modules",
    RouterSetup = "router.setup",
    ChildContainerCreation = "child.container.creation",

}
