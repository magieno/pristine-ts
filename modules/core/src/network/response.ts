import {Request} from "./request";

export class Response {
    status: number;
    headers?: { [key: string]: string };
    body?: any;
    request: Request
}