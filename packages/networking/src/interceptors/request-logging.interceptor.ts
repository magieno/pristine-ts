import {injectable, inject} from "tsyringe";
import {LoggableError, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {NetworkingModuleKeyname} from "../networking.module.keyname";
import {RequestInterceptorInterface} from "../interfaces/request-interceptor.interface";
import {ResponseInterceptorInterface} from "../interfaces/response-interceptor.interface";
import {ErrorResponseInterceptorInterface} from "../interfaces/error-response-interceptor.interface";
import {Request} from "../models/request";
import {Response} from "../models/response";

@injectable()
@moduleScoped(NetworkingModuleKeyname)
@tag(ServiceDefinitionTagEnum.RequestInterceptor)
@tag(ServiceDefinitionTagEnum.ResponseInterceptor)
@tag(ServiceDefinitionTagEnum.ErrorResponseInterceptor)
export class RequestLoggingInterceptor implements RequestInterceptorInterface, ResponseInterceptorInterface, ErrorResponseInterceptorInterface {
    constructor(@inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {
    }

    /**
     * Intercepts an error in a response and logs the error.
     * @param error
     * @param request
     * @param response
     */
    async interceptError(error: Error, request: Request, response: Response): Promise<Response> {
        let extra = {
            stack: error.stack,
            name: error.name,
        };

        if(error instanceof LoggableError) {
            extra = {
                ...error.extra,
                ...extra,
            };
        }

        this.logHandler.error(error.message, extra, NetworkingModuleKeyname);

        return response;
    }

    /**
     * Intercepts a request and logs it.
     * @param request
     */
    async interceptRequest(request: Request): Promise<Request> {
        this.logHandler.info(request.url, {request}, NetworkingModuleKeyname);
        return request;
    }

    /**
     * Intercepts a response and logs it.
     * @param response
     * @param request
     */
    async interceptResponse(response: Response, request: Request): Promise<Response> {
        this.logHandler.info(request.url, {response}, NetworkingModuleKeyname);
        return response;
    }

}
