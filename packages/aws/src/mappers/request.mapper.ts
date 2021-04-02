import {injectable} from "tsyringe";

import {RequestInterface} from "@pristine-ts/networking";
import {ApiGatewayRequest} from "../types/api-gateway-request.type";
import {RequestMapperFactory} from "../factories/request-mapper.factory";

@injectable()
export class RequestMapper {
    constructor(private readonly requestMapperFactory: RequestMapperFactory) {
    }

    map(request: ApiGatewayRequest): RequestInterface {
        return this.requestMapperFactory.getRequestMapper(request).map(request);
    }
}
