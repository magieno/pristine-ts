/**
 * The answer `CorsRequestHandler` produces for a CORS preflight that must be short-circuited
 * before routing. `KernelHttpServer` writes `statusCode` and `headers` straight to the
 * `ServerResponse` without ever invoking `kernel.handle()` — a preflight never corresponds to a
 * real route.
 */
export interface CorsPreflightResponseInterface {
  /**
   * The status code to write. Always `204 No Content` for a preflight.
   */
  statusCode: number;

  /**
   * The response headers to write. Populated with the `Access-Control-*` set when the origin is
   * allow-listed; an empty object when it is not (the browser then blocks for lack of an
   * `Access-Control-Allow-Origin`, and we never reflect an arbitrary origin or emit `"*"`).
   */
  headers: { [name: string]: string };
}
