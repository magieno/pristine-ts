import {Request} from "../network/request";

export interface RequestInterceptorInterface {
    interceptRequest(request: Request): Promise<Request>;
}