import {
  Event,
  EventMapperInterface,
  EventResponse,
  EventsExecutionOptionsInterface,
  ExecutionContextInterface
} from "@pristine-ts/core";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {EventBridgePayload} from "../event-payloads/event-bridge.payload";
import {EventBridgeEventTypeEnum} from "../enums/event-bridge-event-type.enum";
import {AwsModuleKeyname} from "../aws.module.keyname";

/**
 * Mapper to map the Event bridge event into a Pristine event.
 * It is tagged as an ServiceDefinitionTagEnum.EventMapper so that it can be injected with all the other event mappers.
 * It is module scoped so that it gets injected only if the AWS module is imported.
 */
@tag(ServiceDefinitionTagEnum.EventMapper)
@moduleScoped(AwsModuleKeyname)
@injectable()
export class EventBridgeEventMapper implements EventMapperInterface<EventBridgePayload, void> {

  /**
   * Maps the Event bridge raw event into a Pristine event.
   * @param rawEvent The raw Event bridge event
   * @param executionContext The ExecutionContext from where the event is triggered.
   */
  map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<EventBridgePayload> {
    const parsedEvents: Event<EventBridgePayload>[] = [];

    let eventType: EventBridgeEventTypeEnum;

    if (rawEvent.source === "aws.events") {
      eventType = EventBridgeEventTypeEnum.ScheduledEvent
    } else {
      eventType = EventBridgeEventTypeEnum.Event
    }

    const event = new Event<EventBridgePayload>(eventType, new EventBridgePayload(), rawEvent.id);

    event.payload = new EventBridgePayload();
    event.payload.id = rawEvent.id;
    event.payload.source = rawEvent.source;
    event.payload.version = rawEvent.version;
    event.payload.detailType = rawEvent["detail-type"];
    event.payload.account = rawEvent.account;
    event.payload.time = rawEvent.time;
    event.payload.region = rawEvent.region;
    event.payload.resources = rawEvent.resources;
    event.payload.detail = rawEvent.detail;

    parsedEvents.push(event);

    return {
      executionOrder: 'parallel',
      events: parsedEvents,
    };
  }

  /**
   * Determines if the parser supports mapping the raw event to a Pristine event.
   * This mapper only supports raw Event Bridge events.
   * @param event The event to verify if the parser supports.
   * @param executionContext The ExecutionContext from where the event is triggered. It can easily be used to determine
   * where the current service is hosted.
   */
  supportsMapping(event: any, executionContext: ExecutionContextInterface<any>): boolean {
    return event.hasOwnProperty("source") &&
      event.hasOwnProperty("id") &&
      event.hasOwnProperty("version") &&
      event.hasOwnProperty("detail-type") &&
      event.hasOwnProperty("account") &&
      event.hasOwnProperty("time") &&
      event.hasOwnProperty("region") &&
      event.hasOwnProperty("resources") &&
      event.hasOwnProperty("detail");
  }

  /**
   * Determines if the parser supports mapping the Pristine event to an event response.
   * For now it does not support a response.
   * @param eventResponse The event response.
   * @param response The response.
   * @param executionContext The execution context of the event.
   */
  supportsReverseMapping(eventResponse: EventResponse<EventBridgePayload, void>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
    // todo: implement
    return false;
  }

  /**
   * Reverse maps the Pristine event into an event response.
   * For now it does not mapping a Pristine event to an Event Bridge response.
   * @param eventResponse The event response.
   * @param response The response.
   * @param executionContext The execution context of the event.
   */
  reverseMap(eventResponse: EventResponse<EventBridgePayload, void>, response: any, executionContext: ExecutionContextInterface<any>): void {
    // todo: implement
  }
}
