import {injectable} from "tsyringe";

@injectable()
export class HeadersMapper {
  map(headers: Headers): { [key: string]: string } {
    const mappedHeaders: { [key: string]: string } = {}

    headers.forEach((key, value) => {
      mappedHeaders[key] = value;
    })

    return mappedHeaders;
  }

  reverseMap(headers: { [key: string]: string }): Headers {
    const mappedHeaders = new Headers();

    for (const key in headers) {
      if (headers.hasOwnProperty(key) === false) {
        continue;
      }

      mappedHeaders.set(key, headers[key]);
    }

    return mappedHeaders;
  }
}
