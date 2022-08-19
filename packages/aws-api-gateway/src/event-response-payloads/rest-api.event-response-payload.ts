/**
 * The response payload that we will return to Api gateway when Api gateway is set to version 1.0 (Rest Api).
 */
export class RestApiEventResponsePayload {
    /**
     * The response headers.
     */
    headers: {[key: string]: string} = {};

    /**
     * Whether or not the response is Base64 encoded
     */
    isBase64Encoded: boolean = false;

    /**
     * The response headers that have multivalues (arrays)
     */
    multiValueHeaders: {[key: string]: string[]} = {};

    /**
     * The body of the response
     */
    body?: string; // todo, we might have to change this eventually.

    /**
     * The response payload that we will return to Api gateway when Api gateway is set to version 1.0 (Rest Api).
     * @param statusCode The status code of the response to return.
     * @param body The body of the response to return.
     */
    public constructor(public readonly statusCode: number, body?: string) {
        this.body = body;
    }
}
