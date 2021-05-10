import {MethodRouterNode} from "../nodes/method-router.node";
import {Response} from "../models/response";
import {Request} from "../models/request";

/**
 * The Response Enhancer Interface defines the methods that a Response Enhancer must implement. This
 * Enhancer is called after the controllers returned a response and before the interceptors.
 */
export interface ResponseEnhancerInterface {
    /**
     * This method receives a response object and the associated request and must return a transformed response object.
     * If you don't want to manipulate the response object (when logging for example), juste resolve a promise with the response passed to this method.
     *
     * If you force to never resolve the promise, the execution will stall. Be careful.
     *
     * @param response
     * @param request
     * @param methodeNode
     */
    enhanceResponse(response: Response, request: Request, methodeNode: MethodRouterNode): Promise<Response>;
}
