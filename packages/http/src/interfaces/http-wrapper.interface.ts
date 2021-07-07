import {HttpRequestInterface} from "./http-request.interface";
import {HttpResponseInterface} from "./http-response.interface";

export interface HttpWrapperInterface {
    executeRequest(request: HttpRequestInterface): Promise<HttpResponseInterface>;
}
