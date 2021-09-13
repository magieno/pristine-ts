import {inject, injectable} from "tsyringe";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {HttpRequestInterface} from "../interfaces/http-request.interface";
import {HttpRequestOptions} from "../options/http-request.options.";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {HttpResponseInterceptorInterface} from "../interfaces/http-response-interceptor.interface";
import {HttpResponseInterface} from "../interfaces/http-response.interface";

/**
 * This class is an interceptor to log incoming http responses.
 * It is tagged as an HttpResponseInterceptor so it can be automatically injected with the all the other HttpResponseInterceptors.
 */
@tag(ServiceDefinitionTagEnum.HttpResponseInterceptor)
@injectable()
export class HttpResponseLoggingInterceptor implements HttpResponseInterceptorInterface {
    constructor(@inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {
    }

    /**
     * This method intercepts an incoming http response and logs it.
     * @param request
     * @param options
     * @param response
     */
    async interceptResponse(request: HttpRequestInterface, options: HttpRequestOptions, response: HttpResponseInterface): Promise<HttpResponseInterface> {
        this.logHandler.info("Receiving http response", {response, options});
        return response;
    }

}
