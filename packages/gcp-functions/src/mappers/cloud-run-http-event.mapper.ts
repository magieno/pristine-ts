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
import {CloudRunHttpEventPayload} from "../event-payloads/cloud-run-http.event-payload";
import {GcpFunctionsHttpEventResponsePayload} from "../event-response-payloads/gcp-functions-http.event-response-payload";
import {BaseGcpHttpEventMapper} from "./base-gcp-http-event.mapper";

/**
 * Maps a Cloud Run HTTP request into Pristine. Cloud Run delivers raw HTTP (the
 * container hosts a normal `http.Server`); the entry-point shim normalizes the Node
 * `IncomingMessage` into a plain object before invoking `kernel.handle(...)` with
 * the `GcpCloudRun` execution context.
 */
@moduleScoped(GcpFunctionsModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventMapper)
@injectable()
export class CloudRunHttpEventMapper
  extends BaseGcpHttpEventMapper
  implements EventMapperInterface<CloudRunHttpEventPayload | Request, GcpFunctionsHttpEventResponsePayload | Response> {

  constructor(
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    @injectConfig(GcpFunctionsConfigurationKeys.CloudRunHandlingStrategy) private readonly handlingStrategy: GcpFunctionsEventsHandlingStrategyEnum,
    private readonly eventIdManager: EventIdManager,
  ) {
    super();
  }

  supportsMapping(rawEvent: any, executionContext: ExecutionContextInterface<any>): boolean {
    return executionContext?.keyname === ExecutionContextKeynameEnum.GcpCloudRun
      && rawEvent !== undefined && rawEvent !== null && typeof rawEvent === "object"
      && rawEvent.hasOwnProperty("method") && rawEvent.hasOwnProperty("url") && rawEvent.hasOwnProperty("headers");
  }

  map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<CloudRunHttpEventPayload | Request> {
    const eventId = this.eventIdManager.generateEventId();
    switch (this.handlingStrategy) {
      case GcpFunctionsEventsHandlingStrategyEnum.Request: {
        const request = this.toPristineRequest(rawEvent.method, rawEvent.url, rawEvent.headers, rawEvent.body, eventId);
        return {
          executionOrder: "sequential",
          events: [new Event<Request>(GcpFunctionsEventTypeEnum.CloudRunHttpEvent, request, request.id)],
        };
      }
      case GcpFunctionsEventsHandlingStrategyEnum.Event:
      default: {
        const payload = new CloudRunHttpEventPayload(
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
          events: [new Event<CloudRunHttpEventPayload>(GcpFunctionsEventTypeEnum.CloudRunHttpEvent, payload, eventId)],
        };
      }
    }
  }

  supportsReverseMapping(eventResponse: EventResponse<any, any>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
    return eventResponse.event.type === GcpFunctionsEventTypeEnum.CloudRunHttpEvent;
  }

  reverseMap(eventResponse: EventResponse<any, any>, response: any, executionContext: ExecutionContextInterface<any>): GcpFunctionsHttpEventResponsePayload {
    return this.toResponsePayload(eventResponse, this.logHandler);
  }
}
