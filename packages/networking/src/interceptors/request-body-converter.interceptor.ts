import {injectable, inject} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {moduleScoped, Request, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {NetworkingModuleKeyname} from "../networking.module.keyname";
import {RequestInterceptorInterface} from "../interfaces/request-interceptor.interface";
import {InvalidBodyHttpError} from "../errors/invalid-body.http-error";
import {RequestInterceptorPriorityEnum} from "../enums/request-interceptor-priority.enum";

/**
 * The Request Body Converter Interceptor intercepts the request and parses the body based on the Content-tTpe header.
 * It is tagged as a RequestInterceptor so it can be automatically injected with the all the other RequestInterceptor.
 */
@tag(ServiceDefinitionTagEnum.RequestInterceptor)
@moduleScoped(NetworkingModuleKeyname)
@injectable()
export class RequestBodyConverterInterceptor implements RequestInterceptorInterface {

    /**
     * The Request Body Converter Interceptor intercepts the request and parses the body based on the Content-Type header.
     * It is tagged as a RequestInterceptor so it can be automatically injected with the all the other RequestInterceptor.
     * @param isActive Whether or not this interceptor is active.
     * @param logHandler The log handler to output logs.
     */
    constructor(@inject("%" + NetworkingModuleKeyname + ".requestBodyConverter.isActive%") private readonly isActive: boolean,
                @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {
    }

    priority = RequestInterceptorPriorityEnum.BodyConverter;

    /**
     * Intercepts the request and parses the body based on it's Content-Type header.
     * @param request The request to intercept.
     */
    async interceptRequest(request: Request): Promise<Request> {
        if(this.isActive === false) {
            return request;
        }

        if(request.hasHeader("Content-Type") === false) {
            return request;
        }

        const contentType: string = request.getHeader("Content-Type") as string;

        switch (contentType.toLowerCase()) {
            case "application/json":


                switch (typeof request.body) {
                    case "undefined":
                        return request;
                    case "object":
                        if(request.body.constructor === Date) {
                            const errorMessage = "RequestBodyConverterInterceptor: This request has the Content-Type header 'application/json' but the body is a Date object which is invalid JSON.";
                            this.logHandler.error(errorMessage, {eventId: request.id, });

                            throw new InvalidBodyHttpError(errorMessage);
                        }
                        return request;

                    case "string":
                        try {
                            if(request.body) {
                                request.body = JSON.parse(request.body);
                            }
                        }
                        catch (e) {
                            const errorMessage = "RequestBodyConverterInterceptor: This request has the Content-Type header 'application/json', and the body is of type string, but the body contains invalid JSON.";
                            this.logHandler.error(errorMessage, {eventId: request.id, });

                            throw new InvalidBodyHttpError(errorMessage);
                        }
                        break;

                    default:
                        const errorMessage = "RequestBodyConverterInterceptor: This request has the Content-Type header 'application/json' but the body contains invalid JSON.";
                        this.logHandler.error(errorMessage, {eventId: request.id, });

                        throw new InvalidBodyHttpError(errorMessage);
                }


        }

        return request;
    }

}
