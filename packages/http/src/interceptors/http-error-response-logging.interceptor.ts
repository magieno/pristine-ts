import {inject, injectable} from "tsyringe";
import { moduleScoped, ServiceDefinitionTagEnum, tag } from "@pristine-ts/common";
import {HttpRequestInterface} from "../interfaces/http-request.interface";
import {HttpRequestOptions} from "../options/http-request.options.";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {HttpResponseInterface} from "../interfaces/http-response.interface";
import {HttpModuleKeyname} from "../http.module.keyname";
import { HttpErrorResponseInterceptorInterface } from "../interfaces/http-error-response-interceptor.interface";

/**
 * This class is an interceptor to log incoming http responses that have errors.
 * It is tagged as an HttpErrorResponseInterceptor so it can be automatically injected with the all the other HttpErrorResponseInterceptors.
 * It is module scoped to the http module so that it is only registered if the http module is imported.
 */
@tag(ServiceDefinitionTagEnum.HttpErrorResponseInterceptor)
@moduleScoped(HttpModuleKeyname)
@injectable()
export class HttpErrorResponseLoggingInterceptor implements HttpErrorResponseInterceptorInterface {
    constructor(
        @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
        @inject("%pristine.http.logging-enabled%") private readonly loggingEnabled: boolean,
        ) {
    }

    /**
     * This method intercepts an incoming http response that has an error and logs it.
     * @param request
     * @param options
     * @param response
     */
    async interceptErrorResponse(request: HttpRequestInterface, options: HttpRequestOptions, response: HttpResponseInterface): Promise<HttpResponseInterface> {
        if(this.loggingEnabled) {
            this.logHandler.error("Receiving http response that has an error", {response, options}, HttpModuleKeyname);
        }

        return response;
    }

}
