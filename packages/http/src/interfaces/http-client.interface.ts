import {RequestInterface} from "@pristine-ts/common";
import {HttpRequestInterface} from "./http-request.interface";
import {HttpResponseInterface} from "./http-response.interface";

export interface HttpClientInterface {
    request(request: HttpRequestInterface): Promise<HttpResponseInterface>;
}
