import {HttpRequestInterface} from "./http-request.interface";
import {HttpRequestOptions} from "../options/http-request.options.";

/**
 * The Http Request Interceptor Interface defines the methods that an Http Request Interceptor must implement. This
 * interceptor is called before the http request is sent.
 */
export interface HttpRequestInterceptorInterface {
  /**
   * This method receives an http request object and must return a transformed http request object. If you don't want to
   * manipulate the request object (when logging for example), juste resolve a promise with the http request passed to this method.
   *
   * If you force to never resolve the promise, the execution will stall. Be careful.
   *
   * @param request
   * @param options
   */
  interceptRequest(request: HttpRequestInterface, options: HttpRequestOptions): Promise<HttpRequestInterface>;
}
