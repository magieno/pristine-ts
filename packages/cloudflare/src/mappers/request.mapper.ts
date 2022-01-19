import {injectable} from "tsyringe";

import {MethodMapper} from "./method.mapper";
import {HeadersMapper} from "./headers.mapper";
import {Request} from "@pristine-ts/common";

// @injectable()
// export class RequestMapper {
//     constructor(private readonly methodMapper: MethodMapper, private readonly headersMapper: HeadersMapper) {
//     }
//
//     async map(request: Request): Promise<Request> {
//         return {
//             url: request.url,
//             httpMethod: this.methodMapper.map(request.method),
//             rawBody: request.body,
//             headers: this.headersMapper.map(request.headers),
//             body: await request.text(),
//         };
//     }
// }
