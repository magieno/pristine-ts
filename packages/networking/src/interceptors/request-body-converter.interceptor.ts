import {injectable, inject} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {moduleScoped, Request, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {NetworkingModuleKeyname} from "../networking.module.keyname";
import {RequestInterceptorInterface} from "../interfaces/request-interceptor.interface";
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
                            const errorMessage = "This request has the Content-Type header 'application/json' but the body is a Date object which is invalid JSON.";
                            this.logHandler.error(errorMessage);

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
                            const errorMessage = "This request has the Content-Type header 'application/json', and the body is of type string, but the body contains invalid JSON.";
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
