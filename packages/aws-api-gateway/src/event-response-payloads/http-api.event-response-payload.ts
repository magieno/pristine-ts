export class HttpApiEventResponsePayload {
    headers: {[key: string]: string} = {};
    isBase64Encoded: boolean = false;
    multiValueHeaders: {[key: string]: string[]} = {};
    body?: string; // todo, we might have to change this eventually.

    public constructor(public readonly statusCode: number, body?: string) {
        this.body = body;
    }
}
