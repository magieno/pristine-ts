import {
  Event,
  EventIdManager,
  EventMapperInterface,
  EventResponse,
  EventsExecutionOptionsInterface,
  ExecutionContextInterface,
} from "@pristine-ts/core";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {GcpModuleKeyname} from "../gcp.module.keyname";
import {EventarcEventPayload} from "../event-payloads/eventarc.event-payload";
import {EventarcEventType} from "../enums/eventarc-event-type.enum";

/**
 * Catch-all mapper for CloudEvents that didn't match a more-specific GCP mapper.
 * Sits at the end of the mapper chain (the more specific mappers — Pub/Sub, Cloud
 * Storage, Firestore — short-circuit `supportsMapping` for events they own; this
 * mapper accepts anything CloudEvent-shaped that nobody else claimed).
 *
 * Detection: the event has a CloudEvent `specversion` (or just `type` + `source`),
 * and isn't one of the GCP-specific shapes already handled. The framework calls
 * `supportsMapping` on every registered mapper; since this one matches broadly,
 * relying on order alone isn't safe — instead, this mapper checks that the event
 * is NOT one of the specific shapes already claimed by the dedicated mappers.
 */
@moduleScoped(GcpModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventMapper)
@injectable()
export class EventarcEventMapper implements EventMapperInterface<EventarcEventPayload, void> {
  constructor(private readonly eventIdManager: EventIdManager) {
  }

  supportsMapping(rawEvent: any, executionContext: ExecutionContextInterface<any>): boolean {
    if (rawEvent === undefined || rawEvent === null || typeof rawEvent !== "object") {
      return false;
    }
    if (typeof rawEvent.type !== "string" || typeof rawEvent.source !== "string") {
      return false;
    }
    // Don't claim events owned by more-specific mappers.
    if (rawEvent.type.startsWith("google.cloud.storage.object.v1.")) {
      return false;
    }
    if (rawEvent.type.startsWith("google.cloud.firestore.document.v1.")) {
      return false;
    }
    // Pub/Sub push has a different shape (no top-level `type`/`source`); already excluded above.
    return true;
  }

  map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<EventarcEventPayload> {
    const payload = new EventarcEventPayload();
    payload.id = rawEvent.id ?? this.eventIdManager.generateEventId();
    payload.specVersion = rawEvent.specversion ?? "1.0";
    payload.type = rawEvent.type;
    payload.source = rawEvent.source;
    payload.subject = rawEvent.subject;
    if (rawEvent.time) {
      payload.time = new Date(rawEvent.time);
    }
    payload.dataContentType = rawEvent.datacontenttype;
    payload.data = rawEvent.data;

    const event = new Event<EventarcEventPayload>(EventarcEventType.EventarcEvent, payload, payload.id);

    return {
      executionOrder: "sequential",
      events: [event],
    };
  }

  supportsReverseMapping(eventResponse: EventResponse<EventarcEventPayload, void>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
    return false;
  }

  reverseMap(eventResponse: EventResponse<EventarcEventPayload, void>, response: any, executionContext: ExecutionContextInterface<any>): void {
  }
}
