import {moduleScoped, Request, Response, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {NetworkingModuleKeyname} from "../networking.module.keyname";
import {MethodRouterNode} from "../nodes/method-router.node";
import {RequestInterceptorInterface} from "../interfaces/request-interceptor.interface";
import {injectable, inject} from "tsyringe";
import { LogHandlerInterface } from "@pristine-ts/logging";

/**
 * The Default ContentType Response Header Interceptor intercepts the response of the router and adds the default content-type header to the response.
 * It is tagged as a RequestInterceptor so it can be automatically injected with the all the other RequestInterceptor.
 */
@tag(ServiceDefinitionTagEnum.RequestInterceptor)
@moduleScoped(NetworkingModuleKeyname)
@injectable()
export class DefaultContentTypeResponseHeaderInterceptor implements RequestInterceptorInterface {

    /**
     * The Default ContentType Response Header Interceptor intercepts the response of the router and adds the default content-type header to the response.
     * It is tagged as a RequestInterceptor so it can be automatically injected with the all the other RequestInterceptor.
     * @param defaultContentTypeResponseHeader The default Content-Type response header to set on responses that do not already have Content-Types.
     * @param isActive Whether or not this interceptor is active.
     * @param logHandler The log handler to output logs.
     */
    constructor(@inject(`%${NetworkingModuleKeyname}.defaultContentTypeResponseHeader%`) private readonly defaultContentTypeResponseHeader: string,
                @inject(`%${NetworkingModuleKeyname}.defaultContentTypeResponseHeader.isActive%`) private readonly isActive: boolean,
                @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface){}

    /**
     * Intercepts the response from the router and adds the Content-Type header to it if it's not already there, with the default provided.
     * @param response The response to intercept.
     * @param request The request that triggered this response.
     * @param methodNode The methode node.
     */
    async interceptResponse(response: Response, request: Request, methodNode?: MethodRouterNode): Promise<Response> {
        if(this.isActive === false) {
            return response;
        }

        if(response.hasHeader("content-type")){
            return response;
        }

        response.setHeader("content-type", this.defaultContentTypeResponseHeader);
        this.logHandler.debug("Set the default content type response header.", {response})

        return response;
    }
}
