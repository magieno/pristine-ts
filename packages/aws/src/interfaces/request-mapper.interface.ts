import {RequestInterface} from "@pristine-ts/common";
import {ApiGatewayRequest} from "../types/api-gateway-request.type";

export interface RequestMapperInterface {
    /**
     * Maps an Api gateway request to a Pristine request.
     * @param request The api gateway request.
     */
    map(request: ApiGatewayRequest): RequestInterface;
}
