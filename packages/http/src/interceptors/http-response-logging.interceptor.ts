import {inject, injectable} from "tsyringe";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {HttpRequestInterface} from "../interfaces/http-request.interface";
import {HttpRequestOptions} from "../options/http-request.options.";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {HttpResponseInterceptorInterface} from "../interfaces/http-response-interceptor.interface";
import {HttpResponseInterface} from "../interfaces/http-response.interface";
import {HttpModuleKeyname} from "../http.module.keyname";

/**
 * This class is an interceptor to log incoming http responses.
 * It is tagged as an HttpResponseInterceptor so it can be automatically injected with the all the other HttpResponseInterceptors.
 * It is module scoped to the http module so that it is only registered if the http module is imported.
 */
@tag(ServiceDefinitionTagEnum.HttpResponseInterceptor)
@moduleScoped(HttpModuleKeyname)
@injectable()
export class HttpResponseLoggingInterceptor implements HttpResponseInterceptorInterface {
  constructor(
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    @inject("%pristine.http.logging-enabled%") private readonly loggingEnabled: boolean,
  ) {
  }

  /**
   * This method intercepts an incoming http response and logs it.
   * @param request
   * @param options
   * @param response
   */
  async interceptResponse(request: HttpRequestInterface, options: HttpRequestOptions, response: HttpResponseInterface): Promise<HttpResponseInterface> {
    if (this.loggingEnabled) {
      // Eventually, add the execution time like this: `[OUTBOUND] GET https://api.stripe.com/v1/charges 200 112ms`
      this.logHandler.info(`[OUTBOUND] ${request.httpMethod} ${request.url} ${response.status}`, {
        highlights: {
          requestBody: request.body,
          requestHeaders: request.headers,
          responseBody: response.body,
          responseHeaders: response.headers
        }, eventId: options.eventId, extra: {response, options}
      });
    }

    return response;
  }

}
