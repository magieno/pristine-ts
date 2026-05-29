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
import {FirestoreEventPayload} from "../event-payloads/firestore.event-payload";
import {FirestoreEventType} from "../enums/firestore-event-type.enum";

/**
 * Maps a GCP Firestore document-change CloudEvent into a
 * Pristine `Event<FirestoreEventPayload>`.
 *
 * Detection: CloudEvent `type` starts with `google.cloud.firestore.document.v1.`.
 */
@moduleScoped(GcpModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventMapper)
@injectable()
export class FirestoreEventMapper implements EventMapperInterface<FirestoreEventPayload, void> {
  constructor(private readonly eventIdManager: EventIdManager) {
  }

  supportsMapping(rawEvent: any, executionContext: ExecutionContextInterface<any>): boolean {
    return rawEvent !== undefined
      && rawEvent !== null
      && typeof rawEvent === "object"
      && typeof rawEvent.type === "string"
      && rawEvent.type.startsWith("google.cloud.firestore.document.v1.");
  }

  map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<FirestoreEventPayload> {
    const payload = new FirestoreEventPayload();
    payload.eventType = rawEvent.type;
    payload.source = rawEvent.source;
    if (rawEvent.time) {
      payload.eventTime = new Date(rawEvent.time);
    }
    payload.data = rawEvent.data;
    payload.documentPath = rawEvent.data?.value?.name ?? rawEvent.data?.oldValue?.name;
    payload.value = rawEvent.data?.value?.fields;
    payload.oldValue = rawEvent.data?.oldValue?.fields;
    payload.updateMask = rawEvent.data?.updateMask?.fieldPaths;

    const eventId = rawEvent.id ?? this.eventIdManager.generateEventId();
    const event = new Event<FirestoreEventPayload>(this.findEnum(rawEvent.type), payload, eventId);

    return {
      executionOrder: "parallel",
      events: [event],
    };
  }

  supportsReverseMapping(eventResponse: EventResponse<FirestoreEventPayload, void>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
    return false;
  }

  reverseMap(eventResponse: EventResponse<FirestoreEventPayload, void>, response: any, executionContext: ExecutionContextInterface<any>): void {
  }

  private findEnum(eventType: string): FirestoreEventType {
    const values = Object.values(FirestoreEventType);
    for (const value of values) {
      if (value === eventType) {
        return value as FirestoreEventType;
      }
    }
    return FirestoreEventType.UnknownFirestoreEvent;
  }
}
