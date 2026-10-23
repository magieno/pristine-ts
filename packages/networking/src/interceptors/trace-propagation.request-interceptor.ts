import {injectConfig, moduleScoped, Request, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {inject, injectable} from "tsyringe";
import {TraceParentParser, TracingManager} from "@pristine-ts/telemetry";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {NetworkingModuleKeyname} from "../networking.module.keyname";
import {NetworkingConfigurationKeys} from "../networking.configuration-keys";
import {RequestInterceptorInterface} from "../interfaces/request-interceptor.interface";
import {RequestInterceptorPriorityEnum} from "../enums/request-interceptor-priority.enum";

/**
 * Continues the trace a caller started. When the request has a valid W3C `traceparent`
 * header, the active trace takes the caller's trace id, so the logs of this request join
 * the caller's logs (a mobile app, another service) under one trace id.
 *
 * The caller's span id goes into the trace context as `trace.parentSpanId`.
 *
 * Best-effort: a missing or invalid header leaves the trace as it is, as the spec requires.
 */
@tag(ServiceDefinitionTagEnum.RequestInterceptor)
@moduleScoped(NetworkingModuleKeyname)
@injectable()
export class TracePropagationRequestInterceptor implements RequestInterceptorInterface {
  public static readonly TraceParentHeader = "traceparent";

  priority = RequestInterceptorPriorityEnum.TracePropagation;

  /**
   * @param isActive Whether or not requests continue the trace named in their `traceparent` header.
   * @param tracingManager The tracing manager that owns the active trace.
   * @param logHandler The log handler to output logs.
   */
  constructor(
    @injectConfig(NetworkingConfigurationKeys.TracePropagationIsActive) private readonly isActive: boolean,
    @inject("TracingManagerInterface") private readonly tracingManager: TracingManager,
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
  ) {
  }

  async interceptRequest(request: Request): Promise<Request> {
    if (this.isActive === false) {
      return request;
    }

    const header = request.getHeader(TracePropagationRequestInterceptor.TraceParentHeader);
    if (header === undefined) {
      return request;
    }

    const traceParent = TraceParentParser.parse(header);
    if (traceParent === undefined) {
      this.logHandler.debug("TracePropagationRequestInterceptor: Ignored an invalid traceparent header.", {highlights: {traceparent: header}});
      return request;
    }

    this.tracingManager.continueTrace(traceParent.traceId);
    this.tracingManager.addToTraceContext({"trace.parentSpanId": traceParent.parentSpanId});

    return request;
  }
}
