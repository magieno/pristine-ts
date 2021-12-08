import {Response} from "../models/response";
import {Request} from "../models/request";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {NetworkingModuleKeyname} from "../networking.module.keyname";
import {RouterResponseEnricherInterface} from "../interfaces/router-response-enricher.interface";
import {MethodRouterNode} from "../nodes/method-router.node";

/**
 * The RouterResponseEnricher enriches the response of the router by adding the response headers specified by the response header decorator.
 * It is tagged as an RouterResponseEnricher so it can be automatically injected with the all the other RouterResponseEnrichers.
 */
@tag(ServiceDefinitionTagEnum.RouterResponseEnricher)
@moduleScoped(NetworkingModuleKeyname)
export class RouterResponseEnricher implements RouterResponseEnricherInterface {
    async enrichResponse(response: Response, request: Request, methodNode: MethodRouterNode): Promise<Response> {
        if(methodNode.route.context && methodNode.route.context.hasOwnProperty("responseHeaders")){
            response.headers = {...response.headers, ...methodNode.route.context.responseHeaders}
        }
        return response;
    }
}
