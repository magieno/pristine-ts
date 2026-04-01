import {Event, EventHandlerInterface, EventResponse} from "@pristine-ts/core";
import {DependencyContainer, inject, injectable} from "tsyringe";
import {RouterInterface} from "../interfaces/router.interface";
import {moduleScoped, Request, Response, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {TracingManagerInterface} from "@pristine-ts/telemetry";
import {NetworkingModuleKeyname} from "../networking.module.keyname";
import {BreadcrumbHandlerInterface, LogHandlerInterface} from "@pristine-ts/logging";

@moduleScoped(NetworkingModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventHandler)
@injectable()
export class RequestEventHandler implements EventHandlerInterface<Request, Response> {
  priority: number = 10000; // Arbitrarily set to 10 000 so that another handler can have more priority, but be certain you know what you are doing.

  constructor(@inject("RouterInterface") private readonly router: RouterInterface,
              @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
              @inject("TracingManagerInterface") private readonly tracingManager: TracingManagerInterface,
              @inject(ServiceDefinitionTagEnum.CurrentChildContainer) private readonly dependencyContainer: DependencyContainer,
              @inject("BreadcrumbHandlerInterface") private readonly breadcrumbHandlerInterface: BreadcrumbHandlerInterface,
  ) {
  }

  supports<T>(event: Event<T>): boolean {
    return event.payload instanceof Request;
  }

  async handle(event: Event<Request>): Promise<EventResponse<Request, Response>> {
    // todo: add tracing to calculate router setup
    // We can use the injected TracingManager
    this.router.setup()
    //previous code:
    //     const routerSetupSpan = new Span(SpanKeynameEnum.RouterSetup);
    //
    //     // Setup the router
    //     this.setupRouter();
    //
    //     routerSetupSpan.endDate = Date.now();
    //     this.initializationSpan.addChild(routerSetupSpan);


    //todo add tracing to calculate request execution
    // todo catch if the method throws even though it should never throw.

    this.logHandler.debug(`[INBOUND REQUEST] ${event.payload.httpMethod} ${event.payload.url}`, {
      highlights: {
        body: event.payload.body,
        headers: event.payload.headers,
      },
      extra: {
        event,
      },
      eventId: event.id,
      breadcrumb: `${NetworkingModuleKeyname}:request.event-handler:handle`,
    },)

    const start = performance.now();

    const response = await this.router.execute(event.payload, this.dependencyContainer);

    const duration = performance.now() - start;

    this.logHandler.notice(`[INBOUND RESPONSE COMPLETED] ${event.payload.httpMethod} ${event.payload.url} ${response.status} ${Math.trunc(duration)}ms `, {
      highlights: {
        requestBody: event.payload.body,
        requestHeaders: event.payload.headers,
        responseBody: response.body,
        responseHeaders: response.headers,
      },
      eventId: event.id,
      extra: {
        event,
        response,
      },
      outputHints: {
        outputBreadcrumbs: true,
      }
    })

    //previous code:
    // const requestSpan = tracingManager.startSpan(SpanKeynameEnum.RequestExecution);

    return new EventResponse<Request, Response>(event, response);
  }

}
