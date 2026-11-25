import {HttpMethod} from "@pristine-ts/common";

/**
 * The base api event mapper from which more specific mapper will extend.
 */
export class BaseApiEventMapper {

  /**
   * Maps the http method to the corresponding enum value.
   * @param method The http method of the request.
   * @protected
   */
  protected mapHttpMethod(method: string): HttpMethod {
    method = method.toLowerCase();

    switch (method) {
      case "get":
        return HttpMethod.Get;
      case "post":
        return HttpMethod.Post;
      case "put":
        return HttpMethod.Put;
      case "patch":
        return HttpMethod.Patch;
      case "delete":
        return HttpMethod.Delete;
      case "options":
        return HttpMethod.Options;
      default:
        return HttpMethod.Get;
    }
  }

  /**
   * Maps the `sourceIp` of the API Gateway request context to `Request.remoteAddress`.
   *
   * API Gateway sets `sourceIp` itself. It is the source address of the TCP connection that made
   * the request to the API Gateway endpoint, so the caller cannot forge it with a header. When a
   * CDN or a proxy is in front of API Gateway, it is the address of that CDN or proxy.
   *
   * @param sourceIp `requestContext.identity.sourceIp` (REST API) or `requestContext.http.sourceIp` (HTTP API).
   * @returns The address, or `undefined` when the event does not carry a usable one (for example
   * an event built by a test tool with no request context).
   * @protected
   */
  protected mapRemoteAddress(sourceIp: unknown): string | undefined {
    if (typeof sourceIp !== "string" || sourceIp === "") {
      return undefined;
    }

    return sourceIp;
  }
}
