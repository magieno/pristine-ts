/**
 * The normalized, transport-agnostic view of a request that `CorsRequestHandler` needs to make
 * a CORS decision. Extracted from Node's `IncomingMessage` (via `CorsRequestHandler.buildContext`)
 * so the decision logic can be unit-tested without a live socket or a Node request object.
 */
export interface CorsRequestContextInterface {
  /**
   * The upper-cased HTTP method (e.g. `"GET"`, `"OPTIONS"`).
   */
  method: string;

  /**
   * The `Origin` request header, if present. Absent for same-origin and non-browser callers.
   */
  origin?: string;

  /**
   * The `Host` request header, if present. Compared against the `allowed-hosts` allowlist as a
   * DNS-rebinding defense for loopback servers.
   */
  host?: string;

  /**
   * The `Access-Control-Request-Method` preflight header. Its presence on an `OPTIONS` request
   * is what distinguishes a CORS preflight from an ordinary `OPTIONS`.
   */
  accessControlRequestMethod?: string;

  /**
   * The `Access-Control-Request-Headers` preflight header, listing the headers the actual
   * request intends to send.
   */
  accessControlRequestHeaders?: string;

  /**
   * `true` when the request carried `Access-Control-Request-Private-Network: true` — the Chrome
   * Private Network Access preflight signal emitted when a public/secure context targets a more
   * private address space (e.g. a loopback daemon).
   */
  accessControlRequestPrivateNetwork: boolean;
}
