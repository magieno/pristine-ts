import {MethodRouterNode} from "../nodes/method-router.node";
import {Response} from "../models/response";
import {Request} from "../models/request";

/**
 * The Router Request Enricher Interface defines the methods that a Router Request Enricher must implement. This
 * Enricher is called juste before the controller method is being called, but after the interceptor and the authentication mechanisms.
 */
export interface RouterRequestEnricherInterface {
    /**
     * This method receives a request object and the associated request and must return a transformed request object.
     * If you don't want to manipulate the request object (when logging for example), juste resolve a promise with the request passed to this method.
     *
     * If you force to never resolve the promise, the execution will stall. Be careful.
     *
     * @param request
     * @param methodeNode
     */
    enrichRequest(request: Request, methodeNode: MethodRouterNode): Promise<Request>;
}
