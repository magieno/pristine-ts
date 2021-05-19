import {HttpRequestInterface} from "./http-request.interface";
import {HttpRequestOptions} from "../options/http-request.options.";

export interface HttpRequestInterceptorInterface {
    interceptRequest(request: HttpRequestInterface, options: HttpRequestOptions): Promise<HttpRequestInterface>;
}
