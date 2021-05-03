import {Request} from "./request";
import {RequestInterface} from "@pristine-ts/common/dist/lib/esm/interfaces/request.interface";

export class Response {
    status: number = 200;
    headers?: { [key: string]: string };
    body?: any;
    request?: RequestInterface;
}