import {Request as ExpressRequest, Response as ExpressResponse} from "express";
import {ExpressRequestWithRawBody} from "../interfaces/express-request-with-raw-body.interface";

/**
 * Captures the exact request bytes from body-parser's `verify` hook so `RequestMapper` can put
 * them on `Request.rawBody`, whatever parser the app mounted.
 *
 * Mount every body parser with `verify: RawBodyCapture.verify`. For bodies no JSON/text parser
 * accepts (audio, images, octet-stream), add a catch-all `express.raw()` after them so the
 * bytes are read at all:
 *
 * ```ts
 * app.use(express.json({verify: RawBodyCapture.verify}));
 * app.use(express.raw({type: () => true, verify: RawBodyCapture.verify}));
 * ```
 *
 * body-parser calls `verify` with the un-decoded `Buffer` before it parses, and a parser skips
 * a request another parser already consumed, so each request is captured exactly once.
 */
export class RawBodyCapture {
  /**
   * body-parser `verify` hook. Stores `buf` on the request as `rawBody`.
   */
  public static verify(request: ExpressRequest, response: ExpressResponse, buf: Buffer): void {
    (request as ExpressRequestWithRawBody).rawBody = buf;
  }

  /**
   * Returns the bytes captured for this request, or `undefined` when no parser ran with the
   * `verify` hook.
   */
  public static get(request: ExpressRequest): Buffer | undefined {
    const rawBody = (request as ExpressRequestWithRawBody).rawBody;
    return Buffer.isBuffer(rawBody) ? rawBody : undefined;
  }
}
