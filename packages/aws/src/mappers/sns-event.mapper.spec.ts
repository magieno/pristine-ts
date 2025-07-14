import "reflect-metadata"
import {Event, ExecutionContextKeynameEnum} from "@pristine-ts/core";
import {SnsEventMapper} from "./sns-event.mapper";
import {SnsEventType} from "../enums/sns-event-type.enum";
import {SnsEventPayload} from "../event-payloads/sns.event-payload";

describe("Sns event mapper", () => {
    //https://docs.aws.amazon.com/lambda/latest/dg/with-sns.html
    const rawEvent = {
        "Records":[
            {
                "EventVersion": "1.0",
                "EventSubscriptionArn": "arn:aws:sns:us-east-2:123456789012:sns-lambda:21be56ed-a058-49f5-8c98-aedd2564c486",
                "EventSource": "aws:sns",
                "Sns": {
                    "SignatureVersion": "1",
                    "Timestamp": "2019-01-02T12:45:07.000Z",
                    "Signature": "tcc6faL2yUC6dgZdmrwh1Y4cGa/ebXEkAi6RibDsvpi+tE/1+82j...65r==",
                    "SigningCertUrl": "https://sns.us-east-2.amazonaws.com/SimpleNotificationService-ac565b8b1a6c5d002d285f9598aa1d9b.pem",
                    "MessageId": "95df01b4-ee98-5cb9-9903-4c221d41eb5e",
                    "Message": "Hello from SNS!",
                    "MessageAttributes": {
                        "Test": {
                            "Type": "String",
                            "Value": "TestString"
                        },
                        "TestBinary": {
                            "Type": "Binary",
                            "Value": "TestBinary"
                        }
                    },
                    "Type": "Notification",
                    "UnsubscribeUrl": "https://sns.us-east-2.amazonaws.com/?Action=Unsubscribe&amp;SubscriptionArn=arn:aws:sns:us-east-2:123456789012:test-lambda:21be56ed-a058-49f5-8c98-aedd2564c486",
                    "TopicArn": "arn:aws:sns:us-east-2:123456789012:sns-lambda",
                    "Subject": "TestInvoke"
                }
            }
            ]
    };

    it("should support an event from sns", () => {
        const snsEventParser = new SnsEventMapper();

        expect(snsEventParser.supportsMapping(rawEvent, {keyname: ExecutionContextKeynameEnum.AwsLambda, context: {}})).toBeTruthy();
    })

    it("should transform an event from sns", () => {

        const snsEventParser = new SnsEventMapper();

        const snsEvent: Event<SnsEventPayload> = {
            type: SnsEventType.Notification,
            id: "95df01b4-ee98-5cb9-9903-4c221d41eb5e",
            payload: {
                eventSource:"aws:sns",
                eventVersion: "1.0",
                eventSubscriptionArn: "arn:aws:sns:us-east-2:123456789012:sns-lambda:21be56ed-a058-49f5-8c98-aedd2564c486",
                sns: {
                    signatureVersion: "1",
                    eventTime: new Date("2019-01-02T12:45:07.000Z"),
                    signature: "tcc6faL2yUC6dgZdmrwh1Y4cGa/ebXEkAi6RibDsvpi+tE/1+82j...65r==",
                    signingCertUrl: "https://sns.us-east-2.amazonaws.com/SimpleNotificationService-ac565b8b1a6c5d002d285f9598aa1d9b.pem",
                    messageId: "95df01b4-ee98-5cb9-9903-4c221d41eb5e",
                    message: "Hello from SNS!",
                    messageAttributes:[
                        {
                            key: "Test",
                            type: "String",
                            value: "TestString",
                        },
                        {
                            key: "TestBinary",
                            type: "Binary",
                            value: "TestBinary",
                        }
                    ],
                    type: "Notification",
                    unsubscribeUrl: "https://sns.us-east-2.amazonaws.com/?Action=Unsubscribe&amp;SubscriptionArn=arn:aws:sns:us-east-2:123456789012:test-lambda:21be56ed-a058-49f5-8c98-aedd2564c486",
                    topicArn:"arn:aws:sns:us-east-2:123456789012:sns-lambda",
                    subject: "TestInvoke"
                }
            }
        }
        expect(snsEventParser.map(rawEvent, {keyname: ExecutionContextKeynameEnum.AwsLambda, context: {}})).toEqual({
            events: [snsEvent],
            executionOrder: 'parallel',
        });
    })
})
