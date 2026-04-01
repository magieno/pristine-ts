import {LoggableError} from "@pristine-ts/common";
import {HttpRequestInterface} from "../interfaces/http-request.interface";
import {HttpRequestOptions} from "../options/http-request.options.";
import {HttpResponseInterface} from "../interfaces/http-response.interface";

/**
 * This Error represents an error when the http client is trying to redirect a response.
 */
export class HttpClientResponseRedirectError extends LoggableError {
  public constructor(readonly message: string, readonly request: HttpRequestInterface, readonly requestOptions: HttpRequestOptions, readonly response: HttpResponseInterface, readonly currentRedirectCount: number) {
    super(message, {
      request,
      requestOptions,
      response,
      currentRedirectCount,
    });

    // Set the prototype explicitly.
    // As specified in the documentation in TypeScript
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, HttpClientResponseRedirectError.prototype);
  }
}
