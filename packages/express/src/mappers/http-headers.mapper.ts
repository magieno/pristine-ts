import {injectable} from "tsyringe";
import {IncomingHttpHeaders} from "http";

@injectable()
export class HttpHeadersMapper {

  /**
   * Maps the headers of an express http request to the headers of a Pristine request.
   * @param incomingHttpHeaders
   */
  map(incomingHttpHeaders: IncomingHttpHeaders): { [key: string]: string } {
    const headers: { [key: string]: string } = {};

    for (const headersKey in incomingHttpHeaders) {
      if (incomingHttpHeaders.hasOwnProperty(headersKey) === false) {
        continue;
      }

      const incomingHttpHeader = incomingHttpHeaders[headersKey];

      if (incomingHttpHeader === undefined) {
        continue;
      } else if (Array.isArray(incomingHttpHeader)) {
        continue;
      }

      headers[headersKey] = incomingHttpHeaders[headersKey] as string;
    }

    return headers;
  }
}
