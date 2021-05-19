import {HttpRequestInterface} from "./http-request.interface";
import {HttpResponseInterface} from "./http-response.interface";
import {HttpRequestOptions} from "../options/http-request.options.";

export interface HttpResponseInterceptorInterface {
    interceptResponse(request: HttpRequestInterface, options: HttpRequestOptions, response: HttpResponseInterface): Promise<HttpResponseInterface>;
}
