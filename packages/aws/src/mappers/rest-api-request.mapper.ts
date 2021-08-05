import {injectable} from "tsyringe";
import {RequestInterface} from "@pristine-ts/common";
import {RequestMapperInterface} from "../interfaces/request-mapper.interface";
import {MethodMapper} from "./method.mapper";
import {RestApiRequestModel} from "../models/rest-api-request.model";
import {BodyMapper} from "./body-mapper";

@injectable()
export class RestApiRequestMapper implements RequestMapperInterface {
    constructor(private readonly methodMapper: MethodMapper,
                private readonly bodyMapper: BodyMapper) {
    }

    /**
     * Maps a rest api request (Api gateway version 1.0) to a Pristine request.
     * @param request The resst api request from Api gateway.
     */
    map(request: RestApiRequestModel): RequestInterface {
        return {
            url: request.path,
            headers: request.headers,
            httpMethod: this.methodMapper.map(request.httpMethod),
            body: this.bodyMapper.map(request.body),
            rawBody: request.body,
        }
    }
}
