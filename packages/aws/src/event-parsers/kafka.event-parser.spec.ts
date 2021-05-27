import "reflect-metadata"
import {Event} from "@pristine-ts/event";
import {SqsEventParser} from "./sqs.event-parser";
import {SqsEventType} from "../enums/sqs-event-type.enum";
import {SqsEventPayload} from "../event-payloads/sqs.event-payload";
import {KafkaEventParser} from "./kafka.event-parser";
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
                    value: "aGVsbG8gZnJvbSBrYWZrYSAx"
                }
            ]
        }
    };

    it("should support an event from kafka", () => {
        const kafkaEventParser = new KafkaEventParser();

        expect(kafkaEventParser.supports(rawEvent)).toBeTruthy();
    })

    it("should transform an event from kafka", () => {

        const kafkaEventParser = new KafkaEventParser();

        const kafkaEvent: Event<KafkaEventPayload> = {
            type: KafkaEventType.KafkaEvent,
            payload: {
                eventSource: "aws:kafka",
                eventSourceArn:"arn:aws:kafka:us-east-1:account:cluster/vpc/uuid",
                topics: [
                    {
                        records: [
                            {
                                topicName: "mytopic0",
                                offset: 15,
                                partition: 0,
                                timestamp: new Date(1596480920837),
                                timestampType: "CREATE_TIME",
                                value: "hello from kafka"
                            }
                        ]
                    },
                    {
                        records: [
                            {
                                topicName: "mytopic1",
                                offset: 15,
                                partition: 0,
                                timestamp: new Date(1596480920837),
                                timestampType: "CREATE_TIME",
                                value: "hello from kafka 1"
                            }
                        ]
                    }
                ]
            }
        }
        expect(kafkaEventParser.parse(rawEvent)).toEqual(kafkaEvent);
    })
})
