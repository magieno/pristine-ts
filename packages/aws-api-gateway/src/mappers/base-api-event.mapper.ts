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
}
