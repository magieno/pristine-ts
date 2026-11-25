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
   * available and never the parsed object; `RawBodyCapture.resolve` owns that rule.
   *
   * `remoteAddress` is `socket.remoteAddress`, the address of the TCP peer. It is never
   * `expressRequest.ip`, which follows `X-Forwarded-For` when `trust proxy` is on.
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
    request.rawBody = RawBodyCapture.resolve(expressRequest);
    // The TCP peer, not `expressRequest.ip`: with `trust proxy` on, Express derives `ip` from the
    // `X-Forwarded-For` header, which the caller controls.
    request.remoteAddress = expressRequest.socket?.remoteAddress;

    return request;
  }
}
