import {injectable} from "tsyringe";

import {RequestInterface} from "@pristine-ts/common";
import {MethodMapper} from "./method.mapper";
import {HeadersMapper} from "./headers.mapper";

@injectable()
export class RequestMapper {
    constructor(private readonly methodMapper: MethodMapper, private readonly headersMapper: HeadersMapper) {
    }

    async map(request: Request): Promise<RequestInterface> {
        return {
            url: request.url,
            httpMethod: this.methodMapper.map(request.method),
            rawBody: request.body,
            headers: this.headersMapper.map(request.headers),
            body: await request.text(),
        };
    }
}
