/**
 * This Request object represents the class used internally that represents a Request.
 */
import {HttpMethod} from "../enums/http-method.enum";

export class Request {
  /**
   * The id of the request to track it across services.
   */
  id: string;

  /**
   * The group id that this request is a part of.
   */
  groupId?: string;

  /**
   * The http method of the request.
   */
  httpMethod: HttpMethod | string;

  /**
   * The url of the request.
   */
  url: string;
  /**
   * The body of the request.
   */
  body: any = {};
  /**
   * The raw body of the request, exactly as it was received and before any parsing.
   *
   * - A `Buffer` when the adapter had the bytes (`KernelHttpServer` in `@pristine-ts/http`, the
   *   Express mapper when a body-parser `verify` hook captured them).
   * - A `string` when the platform only hands over text (API Gateway, Cloud Functions).
   * - `undefined` when there was no body, or the adapter could not capture it.
   *
   * It is never the parsed object. Use `getRawBodyBuffer()` when you need bytes regardless of
   * which form the adapter produced (signature verification, hashing, binary uploads).
   */
  rawBody?: Buffer | string;
  /**
   * The host of the request.
   */
  host?: string;
  /**
   * The address of the directly connected network peer, as the transport saw it. For example
   * `127.0.0.1`, `::1` or `::ffff:127.0.0.1` (an IPv4 peer on a dual-stack socket).
   *
   * It is never taken from a request header (`X-Forwarded-For`, `Forwarded`, `X-Real-IP`), so the
   * caller cannot forge it. Behind a reverse proxy or a load balancer it is the address of that
   * proxy, not of the end user.
   *
   * - `KernelHttpServer` in `@pristine-ts/http` and the Express mapper: `socket.remoteAddress`,
   *   the TCP peer of the Node server.
   * - API Gateway (REST and HTTP API): the `sourceIp` that API Gateway itself puts in the request
   *   context, the TCP peer of the API Gateway endpoint.
   * - `undefined` when the transport does not give one (Cloud Functions / Cloud Run, a `Request`
   *   built by hand, a socket that is already closed).
   *
   * Read-only by convention: the adapter that builds the `Request` sets it once.
   */
  remoteAddress?: string;

  constructor(httpMethod: HttpMethod | string, url: string, id: string) {
    this.httpMethod = httpMethod;
    this.url = url;
    this.id = id;
  }

  /**
   * The headers of the request.
   */
  private _headers: { [key: string]: string } = {};

  /**
   * This method returns all the headers.
   */
  get headers(): { [key: string]: string } {
    return this._headers;
  }

  /**
   * This method sets the headers appropriately.
   *
   * @param headers
   */
  public setHeaders(headers: { [key: string]: string }) {
    for (const name in headers) {
      if (headers.hasOwnProperty(name) === false) {
        continue;
      }

      this.setHeader(name, headers[name])
    }
  }

  /**
   * This method sets a header parameter in the Request.
   *
   * @param name The name of the header.
   * @param value The value of the header.
   */
  public setHeader(name: string, value: string) {
    this.headers[name.toLowerCase()] = value;
  }

  /**
   * This method returns whether or not the header exists in the Request.
   *
   * @param name The name of the header.
   */
  public hasHeader(name: string): boolean {
    return this.headers.hasOwnProperty(name.toLowerCase());
  }

  /**
   * This method returns the header corresponding to the name or undefined if it doesn't exist.
   *
   * @param name The name of the header.
   */
  public getHeader(name: string): string | undefined {
    return this.headers[name.toLowerCase()];
  }

  /**
   * Returns the raw body as bytes: a `Buffer` as is, a `string` encoded as UTF-8, and
   * `undefined` when there is no raw body. This is the accessor to use for anything that must
   * see the exact bytes on the wire (HMAC signature verification, binary uploads).
   */
  public getRawBodyBuffer(): Buffer | undefined {
    if (this.rawBody === undefined) {
      return undefined;
    }

    if (Buffer.isBuffer(this.rawBody)) {
      return this.rawBody;
    }

    return Buffer.from(this.rawBody, "utf8");
  }

  /**
   * Returns just the path portion of `url`, with any query string stripped. Across the
   * mappers that build a `Request` (Node HTTP, Express, AWS REST/HTTP API), `url` is
   * either a bare path (`/products`) or a path with a query string (`/products?q=1`) —
   * never a full URL with scheme/host — so this is a query-string strip, not a URL parse.
   */
  public getPath(): string {
    const queryIndex = this.url.indexOf("?");
    return queryIndex === -1 ? this.url : this.url.slice(0, queryIndex);
  }
}
