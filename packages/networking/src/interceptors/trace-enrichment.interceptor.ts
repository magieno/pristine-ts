import {moduleScoped, Request, Response, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {inject, injectable} from "tsyringe";
import {TracingManager} from "@pristine-ts/telemetry";
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
 * Mutation goes through `TracingManager.addToTraceContext` rather than touching the
 * trace object directly; path extraction lives on `Request.getPath()` rather than in
 * the interceptor. The interceptor itself becomes pure glue between two collaborators.
 *
 * Best-effort: enrichment never alters or fails the response. No-op when there is no
 * active trace (e.g. tracing disabled).
 */
@tag(ServiceDefinitionTagEnum.RequestInterceptor)
@moduleScoped(NetworkingModuleKeyname)
@injectable()
export class TraceEnrichmentInterceptor implements RequestInterceptorInterface {

  constructor(
    @inject("TracingManagerInterface") private readonly tracingManager: TracingManager,
  ) {
  }

  async interceptResponse(response: Response, request: Request, methodNode?: MethodRouterNode): Promise<Response> {
    try {
      this.tracingManager.addToTraceContext({
        "http.method": String(request.httpMethod),
        "http.path": request.getPath(),
        "http.statusCode": String(response.status),
      });
    } catch {
      // Enrichment is purely observational — never let it affect the response.
    }

    return response;
  }
}
