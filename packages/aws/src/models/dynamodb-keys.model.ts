/**
 * Model representing a key of the in the DynamoDb event.
 */
export class DynamodbKeysModel {
  keyName: string;
  keyType: string;
  keyValue: any;
}
