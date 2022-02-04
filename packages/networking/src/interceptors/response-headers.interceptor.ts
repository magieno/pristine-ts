import {moduleScoped, Request, Response, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {NetworkingModuleKeyname} from "../networking.module.keyname";
import {MethodRouterNode} from "../nodes/method-router.node";
import {RequestInterceptorInterface} from "../interfaces/request-interceptor.interface";
import {injectable} from "tsyringe";
/**
 * The Response Interceptor intercepts the response of the router by adding the response headers specified by the response header decorator.
 * It is tagged as a RequestInterceptor so it can be automatically injected with the all the other RequestInterceptor.
 */
@tag(ServiceDefinitionTagEnum.RequestInterceptor)
@moduleScoped(NetworkingModuleKeyname)
@injectable()
export class ResponseHeadersInterceptor implements RequestInterceptorInterface {

    /**
     * Intercepts the response from the router and adds the headers specified by the response header decorator.
     * @param response The response to intercept.
     * @param request The request that triggered this response.
     * @param methodNode The methode node.
     */
    async interceptResponse(response: Response, request: Request, methodNode?: MethodRouterNode): Promise<Response> {
        if(methodNode && methodNode.route.context && methodNode.route.context.hasOwnProperty("responseHeaders")){
            response.setHeaders({...response.headers, ...methodNode.route.context.responseHeaders});
        }

        return response;
    }
}
