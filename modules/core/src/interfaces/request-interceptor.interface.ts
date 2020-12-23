import {Request} from "../network/request";
import {RequestInterface} from "./request.interface";

export interface RequestInterceptorInterface {
    interceptRequest(request: Request): Promise<Request>;
}