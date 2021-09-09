import {RequestInterface} from "@pristine-ts/common";
import {ApiGatewayRequest} from "../types/api-gateway-request.type";

/**
 * The RequestMapper Interface defines the methods that a Request Mapper must implement.
 */
export interface RequestMapperInterface {
    /**
     * Maps an Api gateway request to a Pristine request.
     * @param request The api gateway request.
     */
    map(request: ApiGatewayRequest): RequestInterface;
}
