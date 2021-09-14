import {LoggableError} from "@pristine-ts/common";
import {HttpRequestInterface} from "../interfaces/http-request.interface";
import Url from "url-parse";

/**
 * This Error represents an error when making an http request using the http client
 */
export class HttpClientRequestError extends LoggableError {
    public constructor(readonly message: string, readonly request: HttpRequestInterface, readonly url: Url) {
        super(message, {
            request,
            url,
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, HttpClientRequestError.prototype);
    }
}
