import {injectable} from "tsyringe";

import {RequestInterface} from "@pristine-ts/networking";
import {RequestMapperInterface} from "../interfaces/request-mapper.interface";
import {MethodMapper} from "./method.mapper";
import {RestApiRequestModel} from "../models/rest-api-request.model";

@injectable()
export class RestApiRequestMapper implements RequestMapperInterface {
    constructor(private readonly methodMapper: MethodMapper) {
    }

    map(request: RestApiRequestModel): RequestInterface {
        return {
            url: request.url,
            headers: request.headers,
            httpMethod: this.methodMapper.map(request.httpMethod),
        }
    }
}
