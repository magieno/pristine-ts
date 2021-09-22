import {HttpRequestInterface} from "./http-request.interface";

/**
 * This interface defines what is an http response.
 */
export interface HttpResponseInterface {
    /**
     * The status code of the response
     */
    status: number;

    /**
     *  The headers of the response
     */
    headers?: {
        [key: string]: string;
    };

    /**
     * The body of the response.
     */
    body?: any;

    /**
     * The request that was sent for getting this response.
     */
    request: HttpRequestInterface;
}
