import "reflect-metadata"
import {Event, ExecutionContextKeynameEnum} from "@pristine-ts/core";
import {DynamodbEventMapper} from "./dynamodb-event.mapper";
import {DynamodbEventPayload} from "../event-payloads/dynamodb.event-payload";
import {DynamodbEventType} from "../enums/dynamodb-event-type.enum";

describe("Dynamodb event parser", () => {
  // https://docs.aws.amazon.com/lambda/latest/dg/with-ddb-example.html
  const rawEvent = {
    "Records": [
      {
        "eventID": "1",
        "eventName": "INSERT",
        "eventVersion": "1.0",
        "eventSource": "aws:dynamodb",
        "awsRegion": "us-east-1",
        "dynamodb": {
          "Keys": {
            "Id": {
              "N": "101"
            }
          },
          "NewImage": {
            "Message": {
              "S": "New item!"
            },
            "Id": {
              "N": "101"
            }
          },
          "OldImage": {
            "Message": {
              "S": "New item!"
            },
            "Id": {
              "N": "102"
            }
          },
          "SequenceNumber": "111",
          "SizeBytes": 26,
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "eventSourceARN": "arn:dynamodb/table-name"
      }
    ]
  };

  it("should support an event from dynamodb", () => {
    const dynamodbEventParser = new DynamodbEventMapper();

    expect(dynamodbEventParser.supportsMapping(rawEvent, {
      keyname: ExecutionContextKeynameEnum.AwsLambda,
      context: {}
    })).toBeTruthy();
  })

  it("should transform an event from dynamodb", () => {

    const dynamodbEventParser = new DynamodbEventMapper();

    const dynamodbEvent: Event<DynamodbEventPayload> = {
      type: DynamodbEventType.Insert,
      id: "1",
      payload: {
        "eventId": "1",
        "eventName": "INSERT",
        "eventVersion": "1.0",
        "eventSource": "aws:dynamodb",
        "awsRegion": "us-east-1",
        "dynamodb": {
          "keys": {
            "Id": {
              "N": "101"
            }
          },
          parsedKeys: [
            {
              keyName: "Id",
              keyType: "N",
              keyValue: "101"
            }
          ],
          "newImage": {
            "Message": {
              "S": "New item!"
            },
            "Id": {
              "N": "101"
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
          "oldImage": {
            "Message": {
              "S": "New item!"
            },
            "Id": {
              "N": "102"
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
          "sequenceNumber": "111",
          "sizeBytes": 26,
          "streamViewType": "NEW_AND_OLD_IMAGES"
        },
        "eventSourceArn": "arn:dynamodb/table-name"
      }
    }
    expect(dynamodbEventParser.map(rawEvent, {keyname: ExecutionContextKeynameEnum.AwsLambda, context: {}})).toEqual({
      events: [dynamodbEvent],
      executionOrder: 'parallel',
    });
  })
})
