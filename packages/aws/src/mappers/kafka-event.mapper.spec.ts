import "reflect-metadata"
import {Event, EventIdGenerationStyleEnum, EventIdManager, ExecutionContextKeynameEnum} from "@pristine-ts/core";
import {KafkaEventMapper} from "./kafka-event.mapper";
import {KafkaEventType} from "../enums/kafka-event-type.enum";
import {KafkaEventPayload} from "../event-payloads/kafka.event-payload";

const fakeEventIdManager = new EventIdManager(EventIdGenerationStyleEnum.Uuid);

describe("Kafka event parser", () => {
  const rawEvent = {
    "eventSource": "aws:kafka",
    "eventSourceArn": "arn:aws:kafka:us-east-1:account:cluster/vpc/uuid",
    "records": {
      "mytopic-0": [
        {
          "topic": "mytopic0",
          partition: 0,
          offset: 15,
          timestamp: 1596480920837,
          timestampType: "CREATE_TIME",
          value: "aGVsbG8gZnJvbSBrYWZrYQ=="
        }
      ],
      "mytopic-1": [
        {
          "topic": "mytopic1",
          partition: 0,
          offset: 15,
          timestamp: 1596480920837,
          timestampType: "CREATE_TIME",
          value: "ewoia2V5IjogInZhbHVlIgp9Cg=="
        }
      ]
    }
  };

  it("should support an event from kafka", () => {
    const kafkaEventParser = new KafkaEventMapper(fakeEventIdManager);

    expect(kafkaEventParser.supportsMapping(rawEvent, {
      keyname: ExecutionContextKeynameEnum.AwsLambda,
      context: {}
    })).toBeTruthy();
  })

  it("should transform an event from kafka", () => {

    const kafkaEventParser = new KafkaEventMapper(fakeEventIdManager);

    const expectedPayload1 = {
      eventSource: "aws:kafka",
      eventSourceArn: "arn:aws:kafka:us-east-1:account:cluster/vpc/uuid",
      topicName: "mytopic0",
      messages: [
        {
          offset: 15,
          partition: 0,
          timestamp: new Date(1596480920837),
          timestampType: "CREATE_TIME",
          value: "hello from kafka"
        }
      ]
    };

    const expectedPayload2 = {
      eventSource: "aws:kafka",
      eventSourceArn: "arn:aws:kafka:us-east-1:account:cluster/vpc/uuid",
      topicName: "mytopic1",
      messages: [
        {
          offset: 15,
          partition: 0,
          timestamp: new Date(1596480920837),
          timestampType: "CREATE_TIME",
          value: {
            key: "value"
          }
        }
      ]
    };

    const result = kafkaEventParser.map(rawEvent, {keyname: ExecutionContextKeynameEnum.AwsLambda, context: {}});

    expect(result.executionOrder).toBe("sequential");
    expect(result.events).toHaveLength(2);
    expect(result.events[0].type).toBe(KafkaEventType.KafkaEvent);
    expect(result.events[0].payload).toEqual(expectedPayload1);
    expect(result.events[1].type).toBe(KafkaEventType.KafkaEvent);
    expect(result.events[1].payload).toEqual(expectedPayload2);
    // Each event gets its own generated id (previously they all shared the literal
    // `"kafka"`, which was a bug — every event in a batch had the same correlation id).
    expect(result.events[0].id).toBeTruthy();
    expect(result.events[1].id).toBeTruthy();
    expect(result.events[0].id).not.toBe(result.events[1].id);
  })
})
