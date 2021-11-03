import {RouterRequestEnricherInterface} from "@pristine-ts/networking/dist/lib/esm/interfaces/router-request-enricher.interface";
import {injectable, inject} from "tsyringe";
import {Request} from "@pristine-ts/networking/dist/lib/esm/models/request";
import {MethodRouterNode} from "@pristine-ts/networking/dist/lib/esm/nodes/method-router.node";
import {NetworkingModuleKeyname} from "@pristine-ts/networking/dist/lib/esm/networking.module.keyname";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {InvalidBodyHttpError} from "@pristine-ts/networking";
import {RequestInterceptorInterface} from "../interfaces/request-interceptor.interface";
import {CoreModuleKeyname} from "../core.module.keyname";

@tag(ServiceDefinitionTagEnum.RequestInterceptor)
@moduleScoped(CoreModuleKeyname)
@injectable()
export class RequestBodyConverterInterceptor implements RequestInterceptorInterface {
    constructor(@inject("%" + CoreModuleKeyname + ".requestBodyConverterActive%") private readonly isActive: boolean,
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
        }

        return request;
    }

}