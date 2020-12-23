import {HttpMethod} from "../enums/http-method.enum";
import {RequestInterface} from "../interfaces/request.interface";

export class Request implements RequestInterface {
    httpMethod: HttpMethod | string;
    url: string;
    headers: { [key: string]: string } = {};
    body: any = {};

    constructor(requestInterface: RequestInterface) {
        this.httpMethod = requestInterface.httpMethod;
        this.url = requestInterface.url;
        this.headers = requestInterface.headers ?? {};
        this.body = requestInterface.body ?? {};
    }

    setHeader(name: string, value: string) {
        this.headers[name] = value;
    }

    hasHeader(name: string) {
        return this.headers.hasOwnProperty(name);
    }

    getHeader(name: string): string | undefined {
        return this.headers[name];
    }
}