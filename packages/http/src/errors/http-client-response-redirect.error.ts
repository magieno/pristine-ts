import {PristineError} from "@pristine-ts/common";
import {HttpRequestInterface} from "../interfaces/http-request.interface";
import {HttpRequestOptions} from "../options/http-request.options.";
import {HttpResponseInterface} from "../interfaces/http-response.interface";

/**
 * This Error represents an error when the http client is trying to redirect a response.
 */
export class HttpClientResponseRedirectError extends PristineError {
  public constructor(readonly message: string, readonly request: HttpRequestInterface, readonly requestOptions: HttpRequestOptions, readonly response: HttpResponseInterface, readonly currentRedirectCount: number) {
    super(message, {details: {
      request,
      requestOptions,
      response,
      currentRedirectCount,
    }});  }
}
