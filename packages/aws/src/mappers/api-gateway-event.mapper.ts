import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {AwsModuleKeyname} from "../aws.module.keyname";
import {injectable, inject} from "tsyringe";
import {EventMapperInterface, EventResponse, EventsExecutionOptionsInterface, ExecutionContextInterface} from "@pristine-ts/core";
import {ApiGatewayEventsHandlingStrategyEnum} from "../enums/api-gateway-events-handling-strategy.enum";

@moduleScoped(AwsModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventMapper)
@injectable()
export class ApiGatewayEventMapper implements EventMapperInterface<any, any> {
    constructor(@inject("%" + AwsModuleKeyname + ".api_gateway.rest_api_events.handling_strategy%") private readonly restApiEventsHandlingStrategy: ApiGatewayEventsHandlingStrategyEnum,
                @inject("%" + AwsModuleKeyname + ".api_gateway.http_request_events.handling_strategy%") private readonly httpRequestsHandlingStrategy: ApiGatewayEventsHandlingStrategyEnum) {
    }

    supportsMapping(event: any, executionContext: ExecutionContextInterface<any>): boolean {
        return (    event.hasOwnProperty("version") &&
                    event.version === "2.0" &&
                    event.hasOwnProperty("headers") &&
                    event.hasOwnProperty("requestContext")) ||
            (   event.hasOwnProperty("resource") &&
                event.hasOwnProperty("headers") &&
                event.hasOwnProperty("requestContext"));
    }
    map(event: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<any> {
        // If the configuration is defined to
        if(event.hasOwnProperty("version") && event.version === "2.0") {

        }
        else {

        }
    }
    supportsReverseMapping(eventResponse: EventResponse<any, any>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
        throw new Error("Method not implemented.");
    }
    reverseMap(eventResponse: EventResponse<any, any>, response: any, executionContext: ExecutionContextInterface<any>) {
        throw new Error("Method not implemented.");
    }

}
