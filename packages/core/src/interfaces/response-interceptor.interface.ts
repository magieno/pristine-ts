import {Request} from "../../../networking/src/models/request";
import {Response} from "../../../networking/src/models/response";

/**
 * The Response Interceptor Interface defines the methods that a Response Interceptor must implement. This
 * interceptor is called after the controllers returned a response. This interceptor will also be called after the
 * ErrorResponseInterceptors with the errored response object. If you want to deal with an error in a specific manner
 * you should probably use the ErrorResponseInterceptor.
 */
export interface ResponseInterceptorInterface {
    /**
     * This method receives a response object and the associated request and must return a transformed response object.
     * If you don't want to manipulate the response object (when logging for example), juste resolve a promise with the response passed to this method.
     *
     * If you force to never resolve the promise, the execution will stall. Be careful.
     *
     * @param response
     * @param request
     */
    interceptResponse(response: Response, request: Request): Promise<Response>;
}