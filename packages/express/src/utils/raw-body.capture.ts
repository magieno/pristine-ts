import {Request as ExpressRequest, Response as ExpressResponse} from "express";
import {ExpressRequestWithRawBody} from "../interfaces/express-request-with-raw-body.interface";

/**
 * Owns the raw bytes of an Express request: how they are captured, and how `RequestMapper`
 * resolves them into `Request.rawBody`.
 *
 * Express does not keep the bytes once a body parser has run, so capture them with body-parser's
 * `verify` hook. Mount every parser with `verify: RawBodyCapture.verify`. For bodies no JSON/text
 * parser accepts (audio, images, octet-stream), add a catch-all `express.raw()` after them so the
 * bytes are read at all:
 *
 * ```ts
 * app.use(express.json({verify: RawBodyCapture.verify}));
 * app.use(express.raw({type: () => true, verify: RawBodyCapture.verify}));
 * ```
 *
 * body-parser calls `verify` with the un-decoded `Buffer` before it parses, and a parser skips a
 * request another parser already consumed, so each request is captured exactly once.
 */
export class RawBodyCapture {
  /**
   * body-parser `verify` hook. Stores `buf` on the request as `rawBody`.
   */
  public static verify(request: ExpressRequest, response: ExpressResponse, buf: Buffer): void {
    (request as ExpressRequestWithRawBody).rawBody = buf;
  }

  /**
   * The raw bytes for this request, and never the parsed object:
   *
   * 1. the `Buffer` stored by `verify`;
   * 2. otherwise the body itself when a parser left it as a `Buffer` (`express.raw()`) or a
   *    `string` (`express.text()`);
   * 3. otherwise `undefined`.
   */
  public static resolve(request: ExpressRequest): Buffer | string | undefined {
    const captured = (request as ExpressRequestWithRawBody).rawBody;
    if (Buffer.isBuffer(captured)) {
      return captured;
    }

    const body: unknown = request.body;
    if (Buffer.isBuffer(body) || typeof body === "string") {
      return body;
    }

    return undefined;
  }
}
