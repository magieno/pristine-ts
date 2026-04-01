import "reflect-metadata"
import {Event, ExecutionContextKeynameEnum} from "@pristine-ts/core";
import {KafkaEventMapper} from "./kafka-event.mapper";
import {KafkaEventType} from "../enums/kafka-event-type.enum";
import {KafkaEventPayload} from "../event-payloads/kafka.event-payload";

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
    const kafkaEventParser = new KafkaEventMapper();

    expect(kafkaEventParser.supportsMapping(rawEvent, {
      keyname: ExecutionContextKeynameEnum.AwsLambda,
      context: {}
    })).toBeTruthy();
  })

  it("should transform an event from kafka", () => {

    const kafkaEventParser = new KafkaEventMapper();

    const kafkaEvent1: Event<KafkaEventPayload> = {
      type: KafkaEventType.KafkaEvent,
      id: "kafka",
      payload: {
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
      }
    };

    const kafkaEvent2: Event<KafkaEventPayload> = {
      type: KafkaEventType.KafkaEvent,
      id: "kafka",
      payload: {
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
      }
    };
    expect(kafkaEventParser.map(rawEvent, {keyname: ExecutionContextKeynameEnum.AwsLambda, context: {}})).toEqual({
      events: [kafkaEvent1, kafkaEvent2],
      executionOrder: 'sequential',
    });
  })
})
