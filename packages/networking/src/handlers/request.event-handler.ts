import {Event, EventHandlerInterface, EventResponse} from "@pristine-ts/core";
import {injectable, inject, DependencyContainer} from "tsyringe";
import {Response} from "../models/response";
import {Request} from "../models/request";
import {RouterInterface} from "../interfaces/router.interface";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {TracingManagerInterface} from "@pristine-ts/telemetry";
import {NetworkingModuleKeyname} from "../networking.module.keyname";

@moduleScoped(NetworkingModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventHandler)
@injectable()
export class RequestEventHandler implements EventHandlerInterface<Request, Response> {
    priority: number = 10000; // Arbitrarily set to 10 000 so that another handler can have more priority, but be certain you know what you are doing.

    constructor(@inject("RouterInterface") private readonly router: RouterInterface,
                @inject("TracingManagerInterface") private readonly tracingManager: TracingManagerInterface,
                @inject(ServiceDefinitionTagEnum.CurrentChildContainer) private readonly dependencyContainer: DependencyContainer) {
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

        const response = await this.router.execute(event.payload, this.dependencyContainer);

        //previous code:
        // const requestSpan = tracingManager.startSpan(SpanKeynameEnum.RequestExecution);

        return new EventResponse<Request, Response>(event, response);
    }

}
