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
import {CloudFunctionGen1HttpEventPayload} from "../event-payloads/cloud-function-gen-1-http.event-payload";
import {GcpFunctionsHttpEventResponsePayload} from "../event-response-payloads/gcp-functions-http.event-response-payload";
import {BaseGcpHttpEventMapper} from "./base-gcp-http-event.mapper";

/**
 * Maps a Gen 1 HTTP-triggered Cloud Function request into Pristine. Gen 1 HTTP
 * functions receive an Express-style `(req, res)` pair; the entry-point shim
 * normalizes that into a plain object before calling `kernel.handle(...)` with the
 * `GcpCloudFunction` execution context.
 *
 * Dual-mode strategy: `Request` exposes a Pristine `Request` for controller routing;
 * `Event` exposes the raw event payload for handler-based processing.
 */
@moduleScoped(GcpFunctionsModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventMapper)
@injectable()
export class CloudFunctionGen1HttpEventMapper
  extends BaseGcpHttpEventMapper
  implements EventMapperInterface<CloudFunctionGen1HttpEventPayload | Request, GcpFunctionsHttpEventResponsePayload | Response> {

  constructor(
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    @injectConfig(GcpFunctionsConfigurationKeys.CloudFunctionGen1HandlingStrategy) private readonly handlingStrategy: GcpFunctionsEventsHandlingStrategyEnum,
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
    // Gen 2 functions have CloudEvent `ce-*` headers; if those are present, defer to
    // the Gen 2 mapper. Otherwise this raw HTTP shape is Gen 1.
    const headers = rawEvent.headers ?? {};
    const hasCloudEventHeaders = Object.keys(headers).some(
      (k) => k.toLowerCase() === "ce-specversion" || k.toLowerCase() === "ce-type",
    );
    if (hasCloudEventHeaders) {
      return false;
    }
    return rawEvent.hasOwnProperty("method") && rawEvent.hasOwnProperty("url") && rawEvent.hasOwnProperty("headers");
  }

  map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<CloudFunctionGen1HttpEventPayload | Request> {
    const eventId = this.eventIdManager.generateEventId();
    switch (this.handlingStrategy) {
      case GcpFunctionsEventsHandlingStrategyEnum.Request: {
        const request = this.toPristineRequest(rawEvent.method, rawEvent.url, rawEvent.headers, rawEvent.body, eventId);
        return {
          executionOrder: "sequential",
          events: [new Event<Request>(GcpFunctionsEventTypeEnum.CloudFunctionGen1HttpEvent, request, request.id)],
        };
      }
      case GcpFunctionsEventsHandlingStrategyEnum.Event:
      default: {
        const payload = new CloudFunctionGen1HttpEventPayload(
          rawEvent.method,
          rawEvent.url,
          this.extractPath(rawEvent.url),
        );
        payload.headers = rawEvent.headers ?? {};
        payload.query = rawEvent.query ?? {};
        payload.body = rawEvent.body;
        payload.rawBody = rawEvent.rawBody ?? (typeof rawEvent.body === "string" ? rawEvent.body : undefined);
        payload.ip = rawEvent.ip;
        return {
          executionOrder: "sequential",
          events: [new Event<CloudFunctionGen1HttpEventPayload>(GcpFunctionsEventTypeEnum.CloudFunctionGen1HttpEvent, payload, eventId)],
        };
      }
    }
  }

  supportsReverseMapping(eventResponse: EventResponse<any, any>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
    return eventResponse.event.type === GcpFunctionsEventTypeEnum.CloudFunctionGen1HttpEvent;
  }

  reverseMap(eventResponse: EventResponse<any, any>, response: any, executionContext: ExecutionContextInterface<any>): GcpFunctionsHttpEventResponsePayload {
    return this.toResponsePayload(eventResponse, this.logHandler);
  }
}
