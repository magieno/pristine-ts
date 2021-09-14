import {HttpRequestInterface} from "./http-request.interface";
import {HttpResponseInterface} from "./http-response.interface";

/**
 * The HttpWrapper Interface defines the methods that an Http wrapper must implement.
 */
export interface HttpWrapperInterface {
    /**
     * This method actually executes and http request.
     * @param request
     */
    executeRequest(request: HttpRequestInterface): Promise<HttpResponseInterface>;
}
