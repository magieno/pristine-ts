import {injectable, inject} from "tsyringe";

import {RequestInterface} from "@pristine-ts/common";
import {ApiGatewayRequest} from "../types/api-gateway-request.type";
import {RequestMapperFactory} from "../factories/request-mapper.factory";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {AwsModuleKeyname} from "../aws.module.keyname";

@injectable()
export class RequestMapper {
    constructor(private readonly requestMapperFactory: RequestMapperFactory, @inject("LogHandlerInterface") private readonly loghandler: LogHandlerInterface) {
    }

    /**
     * Maps a request from Api gateway to a Pristine request.
     * @param request The Api gateway request.
     */
    map(request: ApiGatewayRequest): RequestInterface {
        this.loghandler.debug("Mapping the request mapper.", {
            request,
        }, AwsModuleKeyname)

        const mappedRequest = this.requestMapperFactory.getRequestMapper(request).map(request);

        this.loghandler.debug("Mapped request", {
            mappedRequest,
        }, AwsModuleKeyname)

        return mappedRequest;
    }
}
