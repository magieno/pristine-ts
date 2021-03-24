import "reflect-metadata"
import {Event} from "@pristine-ts/event";
import {DynamodbEventParser} from "./dynamodb.event-parser";
import {DynamodbEventPayload} from "../event-payloads/dynamodb.event-payload";
import {DynamodbEventType} from "../enums/dynamodb-event-type.enum";

describe("Dynamodb event parser", () => {
    const rawEvent = {
        "eventID":"1",
        "eventName":"INSERT",
        "eventVersion":"1.0",
        "eventSource":"aws:dynamodb",
        "awsRegion":"us-east-1",
        "dynamodb":{
            "Keys":{
                "Id":{
                    "N":"101"
                }
            },
            "NewImage":{
                "Message":{
                    "S":"New item!"
                },
                "Id":{
                    "N":"101"
                }
            },
            "OldImage":{
                "Message":{
                    "S":"New item!"
                },
                "Id":{
                    "N":"102"
                }
            },
            "SequenceNumber":"111",
            "SizeBytes":26,
            "StreamViewType":"NEW_AND_OLD_IMAGES"
        },
        "eventSourceARN":"arn:dynamodb/table-name"
    };

    it("should support an event from dynamodb", () => {
        const dynamodbEventParser = new DynamodbEventParser();

        expect(dynamodbEventParser.supports(rawEvent)).toBeTruthy();
    })

    it("should transform an event from dynamodb", () => {

        const dynamodbEventParser = new DynamodbEventParser();

        const dynamodbEvent: Event<DynamodbEventPayload> = {
            type: DynamodbEventType.Insert,
            payload: {
                "eventId":"1",
                "eventName":"INSERT",
                "eventVersion":"1.0",
                "eventSource":"aws:dynamodb",
                "awsRegion":"us-east-1",
                "dynamodb":{
                    "keys":{
                        "Id":{
                            "N":"101"
                        }
                    },
                    parsedKeys: [
                        {
                            keyName: "Id",
                            keyType: "N",
                            keyValue: "101"
                        }
                    ],
                    "newImage":{
                        "Message":{
                            "S":"New item!"
                        },
                        "Id":{
                            "N":"101"
                        }
                    },
                    parsedNewImage: [
                        {
                            keyName: "Message",
                            keyType: "S",
                            keyValue: "New item!"
                        },
                        {
                            keyName: "Id",
                            keyType: "N",
                            keyValue: "101"
                        }
                    ],
                    "oldImage":{
                        "Message":{
                            "S":"New item!"
                        },
                        "Id":{
                            "N":"102"
                        }
                    },
                    parsedOldImage: [
                        {
                            keyName: "Message",
                            keyType: "S",
                            keyValue: "New item!"
                        },
                        {
                            keyName: "Id",
                            keyType: "N",
                            keyValue: "102"
                        }
                    ],
                    tableName: "table-name",
                    "sequenceNumber":"111",
                    "sizeBytes":26,
                    "streamViewType":"NEW_AND_OLD_IMAGES"
                },
                "eventSourceArn":"arn:dynamodb/table-name"
            }
        }
        expect(dynamodbEventParser.parse(rawEvent)).toEqual(dynamodbEvent);
    })
})
