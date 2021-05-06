import {Request} from "./request";
import {RequestInterface} from "@pristine-ts/common";

export class Response {
    status: number = 200;
    headers?: { [key: string]: string };
    body?: any;
    request?: RequestInterface;
}
