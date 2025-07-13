import {injectable} from "tsyringe";
import {Request as ExpressRequest} from "express";

import {HttpHeadersMapper} from "./http-headers.mapper";
import {MethodMapper} from "./method.mapper";
import {Request} from "@pristine-ts/common";

@injectable()
export class RequestMapper {
    constructor(private readonly httpHeadersMapper: HttpHeadersMapper,
                private readonly methodMapper: MethodMapper) {
    }

    /**
     * Maps an http expressRequest from express to a Pristine expressRequest.
     * @param expressRequest The http expressRequest from express.
     */
    map(expressRequest: ExpressRequest): Request {
        const request = new Request(this.methodMapper.map(expressRequest.method), expressRequest.url);
        request.setHeaders(this.httpHeadersMapper.map(expressRequest.headers));
        request.body = expressRequest.body;
        request.rawBody = expressRequest.body;
        const requestId = expressRequest.header("x-pristine-request-id")
        if (requestId) {
            request.id = requestId;
        }

        return request;
    }
}
