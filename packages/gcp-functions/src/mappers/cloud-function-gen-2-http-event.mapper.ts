import {injectConfig, moduleScoped, Request, Response, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {inject, injectable} from "tsyringe";
import {
  Event,
  EventIdManager,
  EventMapperInterface,
  EventResponse,
  EventsExecutionOptionsInterface,
  ExecutionContextInterface,
  ExecutionContextKeynameEnum,
} from "@pristine-ts/core";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {GcpFunctionsModuleKeyname} from "../gcp-functions.module.keyname";
import {GcpFunctionsConfigurationKeys} from "../gcp-functions.configuration-keys";
import {GcpFunctionsEventsHandlingStrategyEnum} from "../enums/gcp-functions-events-handling-strategy.enum";
import {GcpFunctionsEventTypeEnum} from "../enums/gcp-functions-event-type.enum";
import {CloudFunctionGen2HttpEventPayload} from "../event-payloads/cloud-function-gen-2-http.event-payload";
import {GcpFunctionsHttpEventResponsePayload} from "../event-response-payloads/gcp-functions-http.event-response-payload";
import {BaseGcpHttpEventMapper} from "./base-gcp-http-event.mapper";

/**
 * Maps a Gen 2 Cloud Function CloudEvent (delivered over HTTP) into Pristine.
 *
 * Gen 2 functions receive CloudEvents in one of two transport modes:
 *   - **Binary** — CloudEvent attributes in `ce-*` headers, `data` in the body.
 *   - **Structured** — A JSON object in the body with `{specversion, id, type, source, data, ...}`.
 *
 * This mapper handles both. Detection: `ExecutionContextKeynameEnum.GcpCloudFunction`
 * + either `ce-*` headers OR a body with `specversion`.
 */
@moduleScoped(GcpFunctionsModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventMapper)
@injectable()
export class CloudFunctionGen2HttpEventMapper
  extends BaseGcpHttpEventMapper
  implements EventMapperInterface<CloudFunctionGen2HttpEventPayload | Request, GcpFunctionsHttpEventResponsePayload | Response> {

  constructor(
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    @injectConfig(GcpFunctionsConfigurationKeys.CloudFunctionGen2HandlingStrategy) private readonly handlingStrategy: GcpFunctionsEventsHandlingStrategyEnum,
    private readonly eventIdManager: EventIdManager,
  ) {
    super();
  }

  supportsMapping(rawEvent: any, executionContext: ExecutionContextInterface<any>): boolean {
    if (executionContext?.keyname !== ExecutionContextKeynameEnum.GcpCloudFunction) {
      return false;
    }
    if (rawEvent === undefined || rawEvent === null || typeof rawEvent !== "object") {
      return false;
    }
    const headers = rawEvent.headers ?? {};
    const hasBinaryCloudEvent = Object.keys(headers).some(
      (k) => k.toLowerCase() === "ce-specversion" || k.toLowerCase() === "ce-type",
    );
    const body = rawEvent.body;
    const hasStructuredCloudEvent = body !== undefined && body !== null
      && typeof body === "object" && typeof body.specversion === "string" && typeof body.type === "string";
    return hasBinaryCloudEvent || hasStructuredCloudEvent;
  }

  map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<CloudFunctionGen2HttpEventPayload | Request> {
    const headers = this.flattenHeaders(rawEvent.headers ?? {});
    const body = rawEvent.body;
    const isStructured = body && typeof body === "object" && typeof (body as any).specversion === "string";

    const payload = new CloudFunctionGen2HttpEventPayload();
    if (isStructured) {
      payload.id = (body as any).id;
      payload.specVersion = (body as any).specversion;
      payload.type = (body as any).type;
      payload.source = (body as any).source;
      payload.subject = (body as any).subject;
      payload.dataContentType = (body as any).datacontenttype;
      if ((body as any).time) {
        payload.time = new Date((body as any).time);
      }
      payload.data = (body as any).data;
    } else {
      payload.id = headers["ce-id"];
      payload.specVersion = headers["ce-specversion"];
      payload.type = headers["ce-type"];
      payload.source = headers["ce-source"];
      payload.subject = headers["ce-subject"];
      payload.dataContentType = headers["ce-datacontenttype"] ?? headers["content-type"];
      if (headers["ce-time"]) {
        payload.time = new Date(headers["ce-time"]);
      }
      payload.data = body;
    }
    payload.id = payload.id ?? this.eventIdManager.generateEventId();
    payload.headers = rawEvent.headers ?? {};

    switch (this.handlingStrategy) {
      case GcpFunctionsEventsHandlingStrategyEnum.Request: {
        const request = this.toPristineRequest(rawEvent.method ?? "POST", rawEvent.url ?? "/", rawEvent.headers, payload.data, payload.id);
        return {
          executionOrder: "sequential",
          events: [new Event<Request>(GcpFunctionsEventTypeEnum.CloudFunctionGen2HttpEvent, request, request.id)],
        };
      }
      case GcpFunctionsEventsHandlingStrategyEnum.Event:
      default:
        return {
          executionOrder: "sequential",
          events: [new Event<CloudFunctionGen2HttpEventPayload>(GcpFunctionsEventTypeEnum.CloudFunctionGen2HttpEvent, payload, payload.id)],
        };
    }
  }

  supportsReverseMapping(eventResponse: EventResponse<any, any>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
    return eventResponse.event.type === GcpFunctionsEventTypeEnum.CloudFunctionGen2HttpEvent;
  }

  reverseMap(eventResponse: EventResponse<any, any>, response: any, executionContext: ExecutionContextInterface<any>): GcpFunctionsHttpEventResponsePayload {
    return this.toResponsePayload(eventResponse, this.logHandler);
  }
}
