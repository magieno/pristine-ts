import {Request} from "../network/request";
import {Response} from "../network/response";

export interface ErrorResponseInterceptorInterface {
    interceptError(error: Error, request: Request, response?: Response): Promise<Response>;
}