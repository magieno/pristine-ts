import {PristineError} from "@pristine-ts/common";
import {HttpRequestInterface} from "../interfaces/http-request.interface";
import {URL} from 'url';

/**
 * This Error represents an error when making an http request using the http client
 */
export class HttpClientRequestError extends PristineError {
  public constructor(readonly message: string, readonly request: HttpRequestInterface, readonly url: URL) {
    super(message, {details: {
      request,
      url,
    }});  }
}
