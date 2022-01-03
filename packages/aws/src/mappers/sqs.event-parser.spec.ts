import "reflect-metadata"
import {Event, ExecutionContextKeynameEnum} from "@pristine-ts/core";
import {SqsEventParser} from "./sqs.event-parser";
import {SqsEventType} from "../enums/sqs-event-type.enum";
import {SqsEventPayload} from "../event-payloads/sqs.event-payload";

describe("Sqs event parser", () => {
    //https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html
    const rawEvent = {
        "Records": [
            {
                "messageId": "059f36b4-87a3-44ab-83d2-661975830a7d",
                "receiptHandle": "AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a...",
                "body": "test",
                "attributes": {
                    "ApproximateReceiveCount": "1",
                    "SentTimestamp": "1545082649183",
                    "SenderId": "AIDAIENQZJOLO23YVJ4VO",
                    "ApproximateFirstReceiveTimestamp": "1545082649185",
                    "SequenceNumber": "18849496460467696128",
                    "MessageGroupId": "1",
                    "MessageDeduplicationId": "1",
                },
                "messageAttributes": {},
                "md5OfBody": "098f6bcd4621d373cade4e832627b4f6",
                "eventSource": "aws:sqs",
                "eventSourceARN": "arn:aws:sqs:us-east-2:123456789012:my-queue",
                "awsRegion": "us-east-2"
            }
        ]
    };

    it("should support an event from sqs", () => {
        const sqsEventParser = new SqsEventParser();

        expect(sqsEventParser.supportsMapping(rawEvent, {
            keyname: ExecutionContextKeynameEnum.AwsLambda,
            context: {}
        })).toBeTruthy();
    })

    it("should transform an event from sqs", () => {

        const sqsEventParser = new SqsEventParser();

        const sqsEvent: Event<SqsEventPayload> = {
            type: SqsEventType.SqsEvent,
            payload: {
                eventSource: "aws:sqs",
                awsRegion: "us-east-2",
                receiptHandle: "AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a...",
                messageAttributes: {},
                body: "test",
                md5OfBody: "098f6bcd4621d373cade4e832627b4f6",
                eventSourceArn: "arn:aws:sqs:us-east-2:123456789012:my-queue",
                messageId: "059f36b4-87a3-44ab-83d2-661975830a7d",
                attributes: {
                    approximateReceiveCount: 1,
                    senderId: "AIDAIENQZJOLO23YVJ4VO",
                    sentTime: new Date(1545082649183),
                    approximateFirstReceiveTime: new Date(1545082649185),
                    sequenceNumber: "18849496460467696128",
                    messageDeduplicationId: "1",
                    messageGroupId: "1"
                }
            }
        }
        expect(sqsEventParser.map(rawEvent, {keyname: ExecutionContextKeynameEnum.AwsLambda, context: {}})).toEqual(
            {
                events: [sqsEvent],
                executionOrder: 'parallel',
            });
    })
})
