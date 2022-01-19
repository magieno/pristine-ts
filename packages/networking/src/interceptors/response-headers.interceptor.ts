import {moduleScoped, Request, Response, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {NetworkingModuleKeyname} from "../networking.module.keyname";
import {MethodRouterNode} from "../nodes/method-router.node";
import {RequestInterceptorInterface} from "../interfaces/request-interceptor.interface";
import {injectable} from "tsyringe";
/**
 * The Request Interceptor intercepts the response of the router by adding the response headers specified by the response header decorator.
 * It is tagged as a RequestInterceptor so it can be automatically injected with the all the other RequestInterceptor.
 */
@tag(ServiceDefinitionTagEnum.RequestInterceptor)
@moduleScoped(NetworkingModuleKeyname)
@injectable()
export class ResponseHeadersInterceptor implements RequestInterceptorInterface {
    async interceptResponse(response: Response, request: Request, methodNode?: MethodRouterNode): Promise<Response> {
        if(methodNode && methodNode.route.context && methodNode.route.context.hasOwnProperty("responseHeaders")){
            response.headers = {...response.headers, ...methodNode.route.context.responseHeaders}
        }

        return response;
    }
}