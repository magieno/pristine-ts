import {HttpRequestInterface} from "./http-request.interface";
import {HttpResponseInterface} from "./http-response.interface";
import {HttpRequestOptions} from "../options/http-request.options.";

/**
 * The HttpClientInterface Interface defines the methods that an Http client must implement.
 */
export interface HttpClientInterface {
    /**
     * This method is the entry point where the request is passed as an argument and the response is returned.
     *
     * @param request
     * @param options
     */
    request(request: HttpRequestInterface, options?: HttpRequestOptions): Promise<HttpResponseInterface>;
}
