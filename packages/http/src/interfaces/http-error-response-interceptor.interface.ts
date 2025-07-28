import {HttpRequestInterface} from "./http-request.interface";
import {HttpResponseInterface} from "./http-response.interface";
import {HttpRequestOptions} from "../options/http-request.options.";

/**
 * The Http Error Response Interceptor Interface defines the methods that an Http Error Response Interceptor must implement. This
 * interceptor is called when receiving a response that has an error to an http request before returning the final response to
 * the caller or retrying the request.
 */
export interface HttpErrorResponseInterceptorInterface {
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
  interceptErrorResponse(request: HttpRequestInterface, options: HttpRequestOptions, response: HttpResponseInterface): Promise<HttpResponseInterface>;
}
