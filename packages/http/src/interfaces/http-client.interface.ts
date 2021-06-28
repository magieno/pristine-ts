import {HttpRequestInterface} from "./http-request.interface";
import {HttpResponseInterface} from "./http-response.interface";
import {HttpRequestOptions} from "../options/http-request.options.";

export interface HttpClientInterface {
    request(request: HttpRequestInterface, options?: HttpRequestOptions): Promise<HttpResponseInterface>;
}
