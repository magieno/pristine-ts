import {injectable} from "tsyringe";
import {Request} from "express";

import {RequestInterface} from "@pristine-ts/common";
import {HttpHeadersMapper} from "./http-headers.mapper";
import {MethodMapper} from "./method.mapper";

@injectable()
export class RequestMapper {
    constructor(private readonly httpHeadersMapper: HttpHeadersMapper,
                private readonly methodMapper: MethodMapper) {
    }

    map(request: Request): RequestInterface {
        return {
            url: request.url,
            headers: this.httpHeadersMapper.map(request.headers),
            httpMethod: this.methodMapper.map(request.method),
        }
    }
}