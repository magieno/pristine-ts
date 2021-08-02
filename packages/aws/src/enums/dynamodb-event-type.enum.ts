/**
 * Event types for DynamoDb stream events
 */
export enum DynamodbEventType {
    UnknownDynamoDbEvent = "UnknownDynamoDbEvent",
    Insert = "INSERT",
    Modify = "MODIFY",
    Remove = "REMOVE"
}
