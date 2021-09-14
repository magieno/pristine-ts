import {injectable} from "tsyringe";

import {RequestMapperInterface} from "../interfaces/request-mapper.interface";
import {RestApiRequestMapper} from "../mappers/rest-api-request.mapper";
import {HttpRequestMapper} from "../mappers/http-request.mapper";
import {ApiGatewayRequest} from "../types/api-gateway-request.type";

@injectable()
export class RequestMapperFactory {
    constructor(private readonly httpRequestMapper: HttpRequestMapper,
                private readonly restApiRequestMapper: RestApiRequestMapper) {
    }

    /**
     * Gets the proper request mapper based on the version of the request.
     * AWS Api gateway has two types of requests Rest Api request (version 1) and Http request (version 2.0).
     * @param request The api gateway request.
     */
    getRequestMapper(request: ApiGatewayRequest): RequestMapperInterface {
        if(request.version === "2.0"){
            return this.httpRequestMapper;
        } else {
            return this.restApiRequestMapper;
        }
    }
}
