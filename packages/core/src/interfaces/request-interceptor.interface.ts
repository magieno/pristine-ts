import {Request} from "../../../networking/src/models/request";
import {RequestInterface} from "../../../networking/src/interfaces/request.interface";

/**
 * The Request Interceptor Interface defines the methods that a Request Interceptor must implement. This
 * interceptor is called before the request is being passed to the controllers, even before the Request is passed
 * to the Router.
 */
export interface RequestInterceptorInterface {
    /**
     * This method receives a request object and must return a transformed request object. If you don't want to
     * manipulate the request object (when logging for example), juste resolve a promise with the request passed to this method.
     *
     * If you force to never resolve the promise, the execution will stall. Be careful.
     *
     * @param request
     */
    interceptRequest(request: Request): Promise<Request>;
}