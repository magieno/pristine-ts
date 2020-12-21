import {Request} from "../network/request";
import {Response} from "../network/response";

export interface ResponseInterceptorInterface {
    interceptResponse(response: Response, request: Request): Promise<Response>;

    interceptError(error: Error, request: Request): Promise<Response>;
}