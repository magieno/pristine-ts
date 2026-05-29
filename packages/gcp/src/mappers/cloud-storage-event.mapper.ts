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
import {CloudStorageEventPayload} from "../event-payloads/cloud-storage.event-payload";
import {CloudStorageEventType} from "../enums/cloud-storage-event-type.enum";

/**
 * Maps a GCP Cloud Storage CloudEvent into a Pristine `Event<CloudStorageEventPayload>`.
 *
 * The raw event can arrive in two shapes:
 *   1. Structured CloudEvent (`{specversion, id, type, source, data, ...}`) — when an
 *      Eventarc trigger or Gen 2 Cloud Function delivers it via HTTP body.
 *   2. Pre-parsed shape from the entry-point shim with the same fields at the top
 *      level. Both are supported.
 *
 * Detection: the CloudEvent `type` starts with `google.cloud.storage.object.v1.`.
 */
@moduleScoped(GcpModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventMapper)
@injectable()
export class CloudStorageEventMapper implements EventMapperInterface<CloudStorageEventPayload, void> {
  constructor(private readonly eventIdManager: EventIdManager) {
  }

  supportsMapping(rawEvent: any, executionContext: ExecutionContextInterface<any>): boolean {
    return rawEvent !== undefined
      && rawEvent !== null
      && typeof rawEvent === "object"
      && typeof rawEvent.type === "string"
      && rawEvent.type.startsWith("google.cloud.storage.object.v1.");
  }

  map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<CloudStorageEventPayload> {
    const payload = new CloudStorageEventPayload();
    payload.eventType = rawEvent.type;
    payload.source = rawEvent.source;
    if (rawEvent.time) {
      payload.eventTime = new Date(rawEvent.time);
    }
    payload.data = rawEvent.data;
    payload.bucket = rawEvent.data?.bucket;
    payload.name = rawEvent.data?.name;
    payload.generation = rawEvent.data?.generation;
    payload.metageneration = rawEvent.data?.metageneration;
    payload.contentType = rawEvent.data?.contentType;
    payload.size = rawEvent.data?.size;
    payload.md5Hash = rawEvent.data?.md5Hash;
    payload.crc32c = rawEvent.data?.crc32c;

    const eventId = rawEvent.id ?? this.eventIdManager.generateEventId();
    const event = new Event<CloudStorageEventPayload>(this.findEnum(rawEvent.type), payload, eventId);

    return {
      executionOrder: "parallel",
      events: [event],
    };
  }

  supportsReverseMapping(eventResponse: EventResponse<CloudStorageEventPayload, void>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
    return false;
  }

  reverseMap(eventResponse: EventResponse<CloudStorageEventPayload, void>, response: any, executionContext: ExecutionContextInterface<any>): void {
  }

  private findEnum(eventType: string): CloudStorageEventType {
    const values = Object.values(CloudStorageEventType);
    for (const value of values) {
      if (value === eventType) {
        return value as CloudStorageEventType;
      }
    }
    return CloudStorageEventType.UnknownCloudStorageEvent;
  }
}
