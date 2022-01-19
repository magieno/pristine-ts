/**
 * This enum defines the default service definition tags. A definition tag is an array of class that can be registered
 * in the container and can be retrieved as an array. For example, if you need to retrieve all the voters, this enum provides
 * an easy way for someone to register a Voter class by simply adding a VOTER token in the container. Then, you can
 * resolve all the voters by requesting the VOTER token and asking the container for a resolveAll.
 */
export enum ServiceDefinitionTagEnum {
    CurrentChildContainer = "CURRENT_CHILD_CONTAINER",
    EventHandler = "EVENT_HANDLER",
    EventInterceptor = "EVENT_INTERCEPTOR",
    EventListener = "EVENT_LISTENER",
    EventMapper = "EVENT_MAPPER",
    EventSubscriber = "EVENT_SUBSCRIBER",
    HttpRequestInterceptor = "HTTP_REQUEST_INTERCEPTOR",
    HttpResponseInterceptor = "HTTP_RESPONSE_INTERCEPTOR",
    IdentityProvider = "IDENTITY_PROVIDER",
    Logger = "LOGGER",
    MethodParameterDecoratorResolver = "METHOD_PARAMETER_DECORATOR_RESOLVER",
    RequestInterceptor = "REQUEST_INTERCEPTOR",
    ScheduledTask = "SCHEDULED_TASK",
    Tracer = "TRACER",
    Voter = "VOTER",
}
