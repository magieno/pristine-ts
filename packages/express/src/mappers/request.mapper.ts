import {injectable} from "tsyringe";
import {Request as ExpressRequest} from "express";
import {HttpHeadersMapper} from "./http-headers.mapper";
import {MethodMapper} from "./method.mapper";
import {Request} from "@pristine-ts/common";
import {v4 as uuidv4} from "uuid";

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
        const requestId = expressRequest.header("x-pristine-request-id")
        const requestGroupId = expressRequest.header("x-pristine-event-group-id")

        const request = new Request(this.methodMapper.map(expressRequest.method), expressRequest.url, requestId ?? uuidv4());
        request.groupId = requestGroupId;
        request.setHeaders(this.httpHeadersMapper.map(expressRequest.headers));
        request.body = expressRequest.body;
        request.rawBody = expressRequest.body;

        return request;
    }
}
