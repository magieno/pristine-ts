import {EventContextManager, moduleScoped, Request, Response, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {NetworkingModuleKeyname} from "../networking.module.keyname";
import {MethodRouterNode} from "../nodes/method-router.node";
import {RequestInterceptorInterface} from "../interfaces/request-interceptor.interface";

/**
 * Stamps the active trace's `context` with the request's HTTP metadata
 * (`http.method`, `http.path`, `http.statusCode`) once the response is known.
 *
 * This makes the trace self-describing: any tracer that persists the trace — the
 * observability store in particular — can render a meaningful request listing
 * (method · path · status) without a separate request log.
 *
 * Best-effort: enrichment never alters or fails the response. No-op when there is no
 * active trace (e.g. a non-HTTP execution, or tracing disabled).
 */
@tag(ServiceDefinitionTagEnum.RequestInterceptor)
@moduleScoped(NetworkingModuleKeyname)
@injectable()
export class TraceEnrichmentInterceptor implements RequestInterceptorInterface {

  async interceptResponse(response: Response, request: Request, methodNode?: MethodRouterNode): Promise<Response> {
    try {
      const trace = EventContextManager.current()?.trace;
      if (trace !== undefined) {
        trace.context = {
          ...trace.context,
          "http.method": String(request.httpMethod),
          "http.path": this.extractPath(request.url),
          "http.statusCode": String(response.status),
        };
      }
    } catch {
      // Enrichment is purely observational — never let it affect the response.
    }

    return response;
  }

  /**
   * Returns the path portion of a request url, dropping the query string. Accepts both
   * absolute urls and bare paths.
   */
  private extractPath(url: string): string {
    try {
      return new URL(url, "http://localhost").pathname;
    } catch {
      const queryIndex = url.indexOf("?");
      return queryIndex === -1 ? url : url.slice(0, queryIndex);
    }
  }
}
