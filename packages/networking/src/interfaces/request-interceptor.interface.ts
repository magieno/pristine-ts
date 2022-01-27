import {Request, Response} from "@pristine-ts/common";
import {MethodRouterNode} from "../nodes/method-router.node";

export interface RequestInterceptorInterface {
    /**
     * This method receives a request object and must return a transformed request object. If you don't want to
     * manipulate the request object (when logging for example), juste resolve a promise with the request passed to this method.
     *
     * If you force to never resolve the promise, the execution will stall. Be careful.
     *
     * @param request
     * @param methodeNode
     */
    interceptRequest?(request: Request, methodeNode: MethodRouterNode): Promise<Request>;

    /**
     * This method receives a response object and the associated request and must return a transformed response object.
     * If you don't want to manipulate the response object (when logging for example), juste resolve a promise with the response passed to this method.
     *
     * If you force to never resolve the promise, the execution will stall. Be careful.
     *
     * @param response
     * @param request
     * @param methodNode
     */
    interceptResponse?(response: Response, request: Request, methodNode?: MethodRouterNode): Promise<Response>;

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
     * @param methodNode
     */
    interceptError?(error: Error,  response: Response, request: Request, methodNode?: MethodRouterNode): Promise<Response>;
}