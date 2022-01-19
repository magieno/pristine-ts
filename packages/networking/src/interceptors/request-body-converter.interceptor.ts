import {injectable, inject} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {NetworkingModuleKeyname} from "../networking.module.keyname";
import {RequestInterceptorInterface} from "../interfaces/request-interceptor.interface";
import {Request} from "../models/request";
import {InvalidBodyHttpError} from "../errors/invalid-body.http-error";

@tag(ServiceDefinitionTagEnum.RequestInterceptor)
@moduleScoped(NetworkingModuleKeyname)
@injectable()
export class RequestBodyConverterInterceptor implements RequestInterceptorInterface {
    constructor(@inject("%" + NetworkingModuleKeyname + ".request_body_converter.is_active%") private readonly isActive: boolean,
                @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {
    }

    async interceptRequest(request: Request): Promise<Request> {
        if(this.isActive === false) {
            return request;
        }

        let contentType: undefined | string;

        for (let key in request.headers) {
            if (request.headers.hasOwnProperty(key) === false) {
                continue;
            }

            const requestHeader = request.headers[key];

            if(key.toLowerCase() === "content-type") {
                contentType = requestHeader;
                break;
            }
        }

        if(contentType === undefined) {
            return request;
        }

        switch (contentType.toLowerCase()) {
            case "application/json":

                switch (typeof request.body) {
                    case "object":
                        return request;

                    case "string":
                        try {
                            if(request.body) {
                                request.body = JSON.parse(request.body);
                            }
                        }
                        catch (e) {
                            const errorMessage = "This request has the Content-Type header 'application/json' but the body contains invalid JSON.";
                            this.logHandler.error(errorMessage);

                            throw new InvalidBodyHttpError(errorMessage);
                        }
                        break;

                    default:
                        const errorMessage = "This request has the Content-Type header 'application/json' but the body contains invalid JSON.";
                        this.logHandler.error(errorMessage);

                        throw new InvalidBodyHttpError(errorMessage);
                }


        }

        return request;
    }

}
