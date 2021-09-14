import {HttpRequestInterface} from "./http-request.interface";
import {HttpResponseInterface} from "./http-response.interface";
import {HttpRequestOptions} from "../options/http-request.options.";

/**
 * The Http Response Interceptor Interface defines the methods that an Http Response Interceptor must implement. This
 * interceptor is called when receiving a response to an http request before returning the final response to the caller.
 */
export interface HttpResponseInterceptorInterface {
    /**
     * This method receives an http response object and the associated request and must return a transformed http response object.
     * If you don't want to manipulate the response object (when logging for example), juste resolve a promise with the response passed to this method.
     *
     * If you force to never resolve the promise, the execution will stall. Be careful.
     *
     * @param response
     * @param options
     * @param request
     */
    interceptResponse(request: HttpRequestInterface, options: HttpRequestOptions, response: HttpResponseInterface): Promise<HttpResponseInterface>;
}
