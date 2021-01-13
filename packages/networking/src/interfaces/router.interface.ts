import {HttpMethod} from "../enums/http-method.enum";
import {RequestInterface} from "./request.interface";
import {DependencyContainer} from "tsyringe";
import {Response} from "../models/response";
import {Request} from "../models/request";
import {Route} from "../models/route";

/**
 * This method defines the interface that the router must implement.
 */
export interface RouterInterface {
    /**
     * This method registers a Route with the specified path and method. The router will know to use the Route
     * object to know how to handle this route when it's being hit.
     *
     * @param path
     * @param method
     * @param route
     */
    register(path: string, method: HttpMethod | string, route: Route)

    /**
     * This method executes the request passed as a parameter. A container must also be passed since we want each
     * request to have its own container so that memory isn't accidently shared between requests.
     *
     * @param request
     * @param container
     */
    execute(request: Request, container: DependencyContainer): Promise<Response>
}