import {injectable} from "tsyringe";
import {RequestInterface} from "@pristine-ts/common";
import {RequestMapperInterface} from "../interfaces/request-mapper.interface";
import {MethodMapper} from "./method.mapper";
import {HttpRequestModel} from "../models/http-request.model";
import {BodyMapper} from "./body-mapper";

@injectable()
export class HttpRequestMapper implements RequestMapperInterface {
    constructor(private readonly methodMapper: MethodMapper,
                private readonly bodyMapper: BodyMapper) {
    }

    /**
     * Maps and HttpRequest (Api gateway version 2.0) to a Pristine request.
     * @param request
     */
    map(request: HttpRequestModel): RequestInterface {
        return {
            url: request.requestContext.http.path,
            headers: request.headers,
            httpMethod: this.methodMapper.map(request.requestContext.http.method),
            body: this.bodyMapper.map(request.body),
            rawBody: request.body,
        }
    }
}
