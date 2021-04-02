import {injectable} from "tsyringe";

import {ApiGatewayRequest} from "../models/api-gateway-request";
import {RequestMapperInterface} from "../interfaces/request-mapper.interface";
import {RestApiRequestMapper} from "../mappers/rest-api-request.mapper";
import {HttpRequestMapper} from "../mappers/http-request.mapper";

@injectable()
export class RequestMapperFactory {
    constructor(private readonly httpRequestMapper: HttpRequestMapper,
                private readonly restApiRequestMapper: RestApiRequestMapper) {
    }

    getRequestMapper(request: ApiGatewayRequest): RequestMapperInterface {
        if(request){
            return this.httpRequestMapper;
        } else {
            return this.restApiRequestMapper;
        }
    }
}
