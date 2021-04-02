import {injectable} from "tsyringe";

import {RequestInterface} from "@pristine-ts/networking";
import {RequestMapperInterface} from "../interfaces/request-mapper.interface";
import {HttpRequest} from "../models/http-request";
import {MethodMapper} from "./method.mapper";

@injectable()
export class HttpRequestMapper implements RequestMapperInterface {
    constructor(private readonly methodMapper: MethodMapper) {
    }

    map(request: HttpRequest): RequestInterface {
        return {
            url: request.url,
            headers: request.headers,
            httpMethod: this.methodMapper.map(request.requestContext.http.method),
        }
    }
}
