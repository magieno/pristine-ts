import {injectable} from "tsyringe";
import {RequestInterface} from "@pristine-ts/common";
import {RequestMapperInterface} from "../interfaces/request-mapper.interface";
import {MethodMapper} from "./method.mapper";
import {HttpRequestModel} from "../models/http-request.model";

@injectable()
export class HttpRequestMapper implements RequestMapperInterface {
    constructor(private readonly methodMapper: MethodMapper) {
    }

    /**
     * Maps and HttpRequest (Api gateway version 2.0) to a Pristine request.
     * @param request
     */
    map(request: HttpRequestModel): RequestInterface {
        return {
            url: request.requestContext.http.path + (request.rawQueryString ? "?" + request.rawQueryString : ""),
            headers: request.headers,
            httpMethod: this.methodMapper.map(request.requestContext.http.method),
            body:request.body,
            rawBody: request.body,
        }
    }

}
