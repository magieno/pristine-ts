import {injectable} from "tsyringe";
import {Request as ExpressRequest} from "express";
import {HttpHeadersMapper} from "./http-headers.mapper";
import {MethodMapper} from "./method.mapper";
import {Request} from "@pristine-ts/common";
import {EventIdManager} from "@pristine-ts/core";
import {RawBodyCapture} from "../utils/raw-body.capture";

@injectable()
export class RequestMapper {
  constructor(private readonly httpHeadersMapper: HttpHeadersMapper,
              private readonly eventIdManager: EventIdManager,
              private readonly methodMapper: MethodMapper) {
  }

  /**
   * Maps an http expressRequest from express to a Pristine expressRequest.
   *
   * `body` is whatever the app's body parser produced. `rawBody` is the exact bytes when they are
   * available, and never the parsed object:
   *
   * 1. the `Buffer` captured by `RawBodyCapture.verify` (mount parsers with that `verify` hook);
   * 2. otherwise the body itself when a parser left it as a `Buffer` (`express.raw()`) or a
   *    `string` (`express.text()`);
   * 3. otherwise `undefined`.
   *
   * @param expressRequest The http expressRequest from express.
   */
  map(expressRequest: ExpressRequest): Request {
    const requestId = expressRequest.header("x-pristine-request-id")
    const requestGroupId = expressRequest.header("x-pristine-event-group-id")

    const request = new Request(this.methodMapper.map(expressRequest.method), expressRequest.url, requestId ?? this.eventIdManager.generateEventId());
    request.groupId = requestGroupId;
    request.setHeaders(this.httpHeadersMapper.map(expressRequest.headers));
    request.body = expressRequest.body;
    request.rawBody = this.mapRawBody(expressRequest);

    return request;
  }

  private mapRawBody(expressRequest: ExpressRequest): Buffer | string | undefined {
    const captured = RawBodyCapture.get(expressRequest);
    if (captured !== undefined) {
      return captured;
    }

    const body: unknown = expressRequest.body;
    if (Buffer.isBuffer(body) || typeof body === "string") {
      return body;
    }

    return undefined;
  }
}
