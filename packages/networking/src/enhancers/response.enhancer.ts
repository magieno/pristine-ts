import {Response} from "../models/response";
import {Request} from "../models/request";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {NetworkingModuleKeyname} from "../networking.module.keyname";
import {ResponseEnhancerInterface} from "../interfaces/response-enhancer.interface";
import {MethodRouterNode} from "../nodes/method-router.node";

@tag(ServiceDefinitionTagEnum.ResponseEnhancer)
@moduleScoped(NetworkingModuleKeyname)
export class ResponseEnhancer implements ResponseEnhancerInterface {
    async enhanceResponse(response: Response, request: Request, methodNode: MethodRouterNode): Promise<Response> {
        if(methodNode.route.context.hasOwnProperty("responseHeaders")){
            response.headers = {...response.headers, ...methodNode.route.context.responseHeaders}
        }
        return response;
    }
}
