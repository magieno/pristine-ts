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
import {PubSubEventPayload} from "../event-payloads/pub-sub.event-payload";
import {PubSubEventType} from "../enums/pub-sub-event-type.enum";

/**
 * Maps a GCP Pub/Sub push-subscription delivery into a Pristine `Event<PubSubEventPayload>`.
 *
 * Pub/Sub push subscriptions deliver a single JSON envelope:
 *
 * ```json
 * { "message": { "data": "<base64>", "messageId": "...", "attributes": {...},
 *                "publishTime": "...", "orderingKey": "..." },
 *   "subscription": "projects/p/subscriptions/s" }
 * ```
 *
 * Mirrors `SqsEventMapper`'s shape and DI registration.
 */
@moduleScoped(GcpModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventMapper)
@injectable()
export class PubSubEventMapper implements EventMapperInterface<PubSubEventPayload, void> {
  constructor(private readonly eventIdManager: EventIdManager) {
  }

  supportsMapping(rawEvent: any, executionContext: ExecutionContextInterface<any>): boolean {
    return rawEvent !== undefined
      && rawEvent !== null
      && typeof rawEvent === "object"
      && rawEvent.hasOwnProperty("message")
      && typeof rawEvent.message === "object"
      && rawEvent.message.hasOwnProperty("data")
      && rawEvent.hasOwnProperty("subscription");
  }

  map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<PubSubEventPayload> {
    const payload = new PubSubEventPayload();
    payload.messageId = rawEvent.message.messageId ?? this.eventIdManager.generateEventId();
    payload.rawData = rawEvent.message.data;
    payload.body = Buffer.from(rawEvent.message.data, "base64").toString("utf-8");
    payload.attributes = rawEvent.message.attributes ?? {};
    payload.subscription = rawEvent.subscription;
    if (rawEvent.message.publishTime) {
      payload.publishTime = new Date(rawEvent.message.publishTime);
    }
    if (rawEvent.message.orderingKey) {
      payload.orderingKey = rawEvent.message.orderingKey;
    }

    const event = new Event<PubSubEventPayload>(PubSubEventType.Message, payload, payload.messageId);

    return {
      executionOrder: payload.orderingKey ? "sequential" : "parallel",
      events: [event],
    };
  }

  supportsReverseMapping(eventResponse: EventResponse<PubSubEventPayload, void>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
    return false;
  }

  reverseMap(eventResponse: EventResponse<PubSubEventPayload, void>, response: any, executionContext: ExecutionContextInterface<any>): void {
  }
}
