import {injectable} from "tsyringe";
import {IncomingHttpHeaders} from "http";

@injectable()
export class HttpHeadersMapper {
    map(incomingHttpHeaders: IncomingHttpHeaders): { [key: string]: string } {
        const headers: { [key: string]: string } = {};

        for (let headersKey in incomingHttpHeaders) {
            if(incomingHttpHeaders.hasOwnProperty(headersKey) === false) {
                continue;
            }

            const incomingHttpHeader = incomingHttpHeaders[headersKey];

            if(incomingHttpHeader === undefined) {
                continue;
            }
            else if(Array.isArray(incomingHttpHeader)) {
                continue;
            }

            headers[headersKey] = incomingHttpHeaders[headersKey] as string;
        }

        return headers;
    }
}
