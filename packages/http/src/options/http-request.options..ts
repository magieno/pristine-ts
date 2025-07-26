import {ResponseTypeEnum} from "../enums/response-type.enum";
import {HttpRequestInterface} from "../interfaces/http-request.interface";
import {HttpResponseInterface} from "../interfaces/http-response.interface";

/**
 * This interface defines what is an Http request options.
 */
export interface HttpRequestOptions {
    /**
     * The response type that is expected. Either raw or parsed as a JSON.
     */
    responseType?: ResponseTypeEnum;

    /**
     * Whether or not to follow redirects when receiving a response that has a redirect status code.
     */
    followRedirects?: boolean;

    /**
     * The maximum number of redirects to follow.
     */
    maximumNumberOfRedirects?: number;

    /**
     * A function that evaluates whether or not the request should be retried when getting an error in the response.
     */
    isRetryable?: ((httpRequestInterface: HttpRequestInterface, httpResponseInterface: HttpResponseInterface) => boolean);

    /**
     * The maximum number of time a request can be retried.
     */
    maximumNumberOfRetries?: number;

    /**
     * The EventId to identify to whom this request is belong to.
     */
    eventId?: string;
}
