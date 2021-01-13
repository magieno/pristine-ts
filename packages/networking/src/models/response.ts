import {Request} from "./request";
import {RequestInterface} from "../interfaces/request.interface";

export class Response {
    status: number = 200;
    headers?: { [key: string]: string };
    body?: any;
    request?: RequestInterface;
}