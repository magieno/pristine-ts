import {RequestInterface} from "@pristine-ts/common";
import {HttpRequestInterface} from "./http-request.interface";

export interface HttpResponseInterface {
    status: number;

    headers?: {
        [key: string]: string;
    };

    body?: any;

    request: HttpRequestInterface;
}
