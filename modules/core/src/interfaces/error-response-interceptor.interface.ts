import {Request} from "../network/request";
import {Response} from "../network/response";

/**
 * The ErrorResponse Interceptor Interface defines the methods that an ErrorResponse Interceptor must implement. This
 * interceptor is called when there's an error
 */
export interface ErrorResponseInterceptorInterface {
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
    interceptError(error: Error, request: Request, response?: Response): Promise<Response>;
}