import {inject, injectable} from "tsyringe";
import {HttpRequestInterceptorInterface} from "../interfaces/http-request-interceptor.interface";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {HttpRequestInterface} from "../interfaces/http-request.interface";
import {HttpRequestOptions} from "../options/http-request.options.";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {HttpModuleKeyname} from "../http.module.keyname";

/**
 * This class is an interceptor to log outgoing http requests.
 * It is tagged as an HttpRequestInterceptor so it can be automatically injected with the all the other HttpRequestInterceptors.
 */
@tag(ServiceDefinitionTagEnum.HttpRequestInterceptor)
@injectable()
export class HttpRequestLoggingInterceptor implements HttpRequestInterceptorInterface {
    constructor(@inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {
    }

    /**
     * This method intercepts an outgoing http request and logs it.
     * @param request
     * @param options
     */
    async interceptRequest(request: HttpRequestInterface, options: HttpRequestOptions): Promise<HttpRequestInterface> {
        this.logHandler.info("Outgoing http request", {request, options}, HttpModuleKeyname);
        return request;
    }
}
