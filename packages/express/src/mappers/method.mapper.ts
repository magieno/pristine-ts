import {injectable} from "tsyringe";
import {HttpMethod} from "@pristine-ts/common";

@injectable()
export class MethodMapper {

  /**
   * Maps an http request method from express to a known method enum of Pristine.
   * @param method
   */
  map(method: string): HttpMethod | string {
    method = method.toLowerCase();

    switch (method) {
      case "get":
        return HttpMethod.Get
      case "post":
        return HttpMethod.Post
      case "put":
        return HttpMethod.Put
      case "patch":
        return HttpMethod.Patch
      case "delete":
        return HttpMethod.Delete
      case "options":
        return HttpMethod.Options
    }

    return method;
  }
}
