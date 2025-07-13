import {inject, injectable} from "tsyringe";
import {HttpRequestInterceptorInterface} from "../interfaces/http-request-interceptor.interface";
import { moduleScoped, ServiceDefinitionTagEnum, tag } from "@pristine-ts/common";
import {HttpRequestInterface} from "../interfaces/http-request.interface";
import {HttpRequestOptions} from "../options/http-request.options.";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {HttpModuleKeyname} from "../http.module.keyname";

/**
 * This class is an interceptor to log outgoing http requests.
 * It is tagged as an HttpRequestInterceptor so it can be automatically injected with the all the other HttpRequestInterceptors.
 * It is module scoped to the http module so that it is only registered if the http module is imported.
 */
@tag(ServiceDefinitionTagEnum.HttpRequestInterceptor)
@moduleScoped(HttpModuleKeyname)
@injectable()
export class HttpRequestLoggingInterceptor implements HttpRequestInterceptorInterface {
    constructor(
        @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
        @inject("%pristine.http.logging-enabled%") private readonly loggingEnabled: boolean,
        ) {
    }

    /**
     * This method intercepts an outgoing http request and logs it.
     * @param request
     * @param options
     */
    async interceptRequest(request: HttpRequestInterface, options: HttpRequestOptions): Promise<HttpRequestInterface> {
        if(this.loggingEnabled) {
            this.logHandler.info("HttpRequestLoggingInterceptor: Outgoing http request.", {extra: {request, options}});
        }

        return request;
    }
}
