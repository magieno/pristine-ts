import {inject, injectable} from "tsyringe";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {HttpRequestInterface} from "../interfaces/http-request.interface";
import {HttpRequestOptions} from "../options/http-request.options.";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {HttpResponseInterceptorInterface} from "../interfaces/http-response-interceptor.interface";
import {HttpResponseInterface} from "../interfaces/http-response.interface";
import {HttpModuleKeyname} from "../http.module.keyname";

@tag(ServiceDefinitionTagEnum.HttpResponseInterceptor)
@injectable()
export class HttpResponseLoggingInterceptor implements HttpResponseInterceptorInterface {
    constructor(@inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {
    }

    async interceptResponse(request: HttpRequestInterface, options: HttpRequestOptions, response: HttpResponseInterface): Promise<HttpResponseInterface> {
        this.logHandler.info("Receiving http response", {response, options}, HttpModuleKeyname);
        return response;
    }

}
