import {injectable} from "tsyringe";
import {HttpRequestInterface} from "../interfaces/http-request.interface";
import {HttpResponseInterface} from "../interfaces/http-response.interface";
import {IncomingMessage, request as httpRequest, RequestOptions} from "http";
import {request as httpsRequest} from "https";
import {URL} from 'url';
import {tag} from "@pristine-ts/common";
import {HttpClientRequestError} from "../errors/http-client-request.error";
import {HttpWrapperInterface} from "../interfaces/http-wrapper.interface";

/**
 * This class is a wrapper around the NodeJS http library for ease of use and testability.
 */
@tag('HttpWrapperInterface')
@injectable()
export class HttpWrapper implements HttpWrapperInterface {
  /**
   * This method directly executes the Http or Https request and returns the response.
   * There is no processing done in this method.
   * @param request
   */
  executeRequest(request: HttpRequestInterface): Promise<HttpResponseInterface> {
    return new Promise((resolve, reject) => {
      // Define the options required by the http and https modules.
      let now: number = -1;

      const url = new URL(request.url);
      const options: RequestOptions = {
        host: url.hostname,
        path: url.pathname + url.search,
        method: request.httpMethod,
        headers: request.headers,
        port: url.port,
      }

      const defaultResponseStatus = 200; // todo: decide if that's how we should proceed
      const response: HttpResponseInterface = {
        request,
        status: defaultResponseStatus,
      };

      const callback = (res: IncomingMessage) => {
        response.headers = res.headers as {
          [key: string]: string;
        };
        response.status = res.statusCode ?? defaultResponseStatus;

        let body = '';

        res.on('data', chunk => {
          response.timeToFirstByte = performance.now() - now;
          body = body + "" + chunk;
        });

        res.on('error', error => {
          response.responseTime = performance.now() - now;
          return reject(error);
        })

        res.on('end', async () => {
          response.body = body;
          response.responseTime = performance.now() - now;

          return resolve(response);
        });
      }

      now = performance.now();

      // Make the http or https call depending on the url.
      if (url.protocol === "http://" || url.protocol === "http:" || url.protocol === "http") {
        const req = httpRequest(options, callback);

        if (request.body) {
          req.write(request.body);
        }

        req.on("error", (e: any) => {
          reject(new HttpClientRequestError(`Error making the HTTP Request. Code: ${e.code}, Message:${e.message}`, request, url));
        })

        return req.end();
      } else if (url.protocol === "https://" || url.protocol === "https:" || url.protocol === "https") {
        options.port = options.port ?? 443;

        const req = httpsRequest(options, callback);

        if (request.body) {
          req.write(request.body);
        }

        req.on("error", (e: any) => {
          reject(new HttpClientRequestError(`Error making the HTTP Request. Code: ${e.code}, Message:${e.message}`, request, url));
        })

        return req.end();
      }

      return reject(new HttpClientRequestError("The protocol for the HttpRequest is invalid. It must be 'http' or 'https'.", request, url));
    })
  }
}
