import {injectable} from "tsyringe";
// import {Response as PristineResponse} from "@pristine-ts/common";
// import {HeadersMapper} from "./headers.mapper";
//
// @injectable()
// export class ResponseMapper {
//   constructor(private readonly headersMapper: HeadersMapper) {
//   }
//
//   map(pristineResponse: PristineResponse): Response {
//     return new Response(pristineResponse.body, {
//       status: pristineResponse.status,
//       headers: this.headersMapper.reverseMap(pristineResponse.headers ?? {}),
//     });
//   }
// }
