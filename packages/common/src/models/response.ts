/**
 * This Response object represents the class used internally that represents a Response.
 */
import {Request} from "./request";

export class Response {
    /**
     * The status code of the response. By default we return a 200.
     */
    status: number = 200;

    /**
     * The headers of the response.
     */
    headers?: { [key: string]: string };

    /**
     * The body of the response.
     */
    body?: any;

    /**
     * The request that triggered this response.
     */
    request?: Request;
}
