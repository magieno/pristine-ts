import {Request} from "./request";

export interface Response {
    status: number;
    headers?: { [key: string]: string };
    body?: any;
    request: Request
}