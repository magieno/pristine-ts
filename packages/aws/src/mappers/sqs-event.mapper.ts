import {
  Event,
  EventMapperInterface,
  EventResponse,
  EventsExecutionOptionsInterface,
  ExecutionContextInterface
} from "@pristine-ts/core";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {SqsEventPayload} from "../event-payloads/sqs.event-payload";
import {SqsAttributesModel} from "../models/sqs-attributes.model";
import {SqsEventType} from "../enums/sqs-event-type.enum";
import {AwsModuleKeyname} from "../aws.module.keyname";

/**
 * Mapper to map the Sqs event into a Pristine event.
 * It is tagged as an ServiceDefinitionTagEnum.EventMapper so that it can be injected with all the other event mappers.
 * It is module scoped so that it gets injected only if the AWS module is imported.
 */
@tag(ServiceDefinitionTagEnum.EventMapper)
@moduleScoped(AwsModuleKeyname)
@injectable()
export class SqsEventMapper implements EventMapperInterface<SqsEventPayload, void> {

  /**
   * Parses the SQS event into a Pristine event.
   * @param rawEvent The raw SQS event
   * @param executionContext The ExecutionContext from where the event is triggered. It can easily be used to determine
   * where the current service is hosted.
   */
  map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<SqsEventPayload> {
    const parsedEvents: Event<SqsEventPayload>[] = [];
    for (const record of rawEvent.Records) {
      const event = new Event<SqsEventPayload>(SqsEventType.SqsEvent, new SqsEventPayload(), record.messageId);

      event.payload.eventSource = record.eventSource;
      event.payload.awsRegion = record.awsRegion;
      event.payload.body = record.body;
      event.payload.eventSourceArn = record.eventSourceARN;
      event.payload.md5OfBody = record.md5OfBody;
      event.payload.messageAttributes = record.messageAttributes;
      event.payload.receiptHandle = record.receiptHandle;
      event.payload.messageId = record.messageId;

      if (record.attributes) {
        event.payload.attributes = new SqsAttributesModel();
        if (isNaN(+record.attributes.ApproximateFirstReceiveTimestamp) === false) {
          event.payload.attributes.approximateFirstReceiveTime = new Date(+record.attributes.ApproximateFirstReceiveTimestamp);
        }
        if (isNaN(+record.attributes.SentTimestamp) === false) {
          event.payload.attributes.sentTime = new Date(+record.attributes.SentTimestamp);
        }
        event.payload.attributes.senderId = record.attributes.SenderId;
        event.payload.attributes.approximateReceiveCount = isNaN(+record.attributes.ApproximateReceiveCount) ? undefined : +record.attributes.ApproximateReceiveCount;

        event.payload.attributes.messageGroupId = record.attributes.MessageGroupId;
        event.payload.attributes.messageDeduplicationId = record.attributes.MessageDeduplicationId;
        event.payload.attributes.sequenceNumber = record.attributes.SequenceNumber;
      }

      parsedEvents.push(event);
    }

    // todo: change to sequential if type of SQS is FIFO.
    return {
      executionOrder: 'parallel',
      events: parsedEvents,
    };
  }

  /**
   * Determines if the parser supports the event.
   * @param event The event to verify if the parser supports.
   * @param executionContext The ExecutionContext from where the event is triggered. It can easily be used to determine
   * where the current service is hosted.
   */
  supportsMapping(event: any, executionContext: ExecutionContextInterface<any>): boolean {
    return event.hasOwnProperty("Records") &&
      Array.isArray(event.Records) &&
      event.Records[0].hasOwnProperty("eventSource") &&
      event.Records[0].eventSource === "aws:sqs"
  }

  /**
   * Determines if the parser supports mapping the Pristine event to an event response.
   * For now it does not support a response.
   * @param eventResponse The event response.
   * @param response The response.
   * @param executionContext The execution context of the event.
   */
  supportsReverseMapping(eventResponse: EventResponse<SqsEventPayload, void>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
    // todo: implement
    return false;
  }

  /**
   * Reverse maps the Pristine event into an event response.
   * For now it does not mapping a Pristine event to an Sqs event response.
   * @param eventResponse The event response.
   * @param response The response.
   * @param executionContext The execution context of the event.
   */
  reverseMap(eventResponse: EventResponse<SqsEventPayload, void>, response: any, executionContext: ExecutionContextInterface<any>): void {
    // todo: implement
  }
}
