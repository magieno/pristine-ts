import {Request} from "../models/request";
import {Response} from "../models/response";

export interface RouterInterceptorInterface {
    /**
     * This method receives a request object and must return a transformed request object. If you don't want to
     * manipulate the request object (when logging for example), juste resolve a promise with the request passed to this method.
     *
     * If you force to never resolve the promise, the execution will stall. Be careful.
     *
     * @param request
     */
    interceptRequest?(request: Request): Promise<Request>;

    /**
     * This method receives a response object and the associated request and must return a transformed response object.
     * If you don't want to manipulate the response object (when logging for example), juste resolve a promise with the response passed to this method.
     *
     * If you force to never resolve the promise, the execution will stall. Be careful.
     *
     * @param response
     * @param request
     */
    interceptResponse?(response: Response, request: Request): Promise<Response>;

    /**
     * Receives an error with the associated request and maybe a response (if you have multiple error response interceptors
     * and they are chained, response will not be empty as it will contain the returned response of the previous error response interceptor).
     *
     * This method must transform the error into a Response object.
     *
     * If you force to never resolve the promise, the execution will stall. Be careful.
     *
     * @param error
     * @param request
     * @param response
     */
    interceptError?(error: Error, request: Request, response: Response): Promise<Response>;
}