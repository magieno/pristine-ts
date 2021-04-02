import {injectable} from "tsyringe";

import {RequestInterface} from "@pristine-ts/networking";
import {RestApiRequest} from "../models/rest-api-request";
import {RequestMapperInterface} from "../interfaces/request-mapper.interface";
import {MethodMapper} from "./method.mapper";

@injectable()
export class RestApiRequestMapper implements RequestMapperInterface {
    constructor(private readonly methodMapper: MethodMapper) {
    }

    map(request: RestApiRequest): RequestInterface {
        return {
            url: request.url,
            headers: request.headers,
            httpMethod: this.methodMapper.map(request.httpMethod),
        }
    }
}
