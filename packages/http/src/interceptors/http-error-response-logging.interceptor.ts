import {inject, injectable} from "tsyringe";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {HttpRequestInterface} from "../interfaces/http-request.interface";
import {HttpRequestOptions} from "../options/http-request.options.";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {HttpResponseInterface} from "../interfaces/http-response.interface";
import {HttpModuleKeyname} from "../http.module.keyname";
import { HttpErrorResponseInterceptorInterface } from "../interfaces/http-error-response-interceptor.interface";

/**
 * This class is an interceptor to log incoming http responses that have errors.
 * It is tagged as an HttpErrorResponseInterceptor so it can be automatically injected with the all the other HttpErrorResponseInterceptors.
 */
@tag(ServiceDefinitionTagEnum.HttpErrorResponseInterceptor)
@injectable()
export class HttpErrorResponseLoggingInterceptor implements HttpErrorResponseInterceptorInterface {
    constructor(@inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {
    }

    /**
     * This method intercepts an incoming http response that has an error and logs it.
     * @param request
     * @param options
     * @param response
     */
    async interceptErrorResponse(request: HttpRequestInterface, options: HttpRequestOptions, response: HttpResponseInterface): Promise<HttpResponseInterface> {
        this.logHandler.info("Receiving http response that has an error", {response, options}, HttpModuleKeyname);
        return response;
    }

}
