import {DynamodbKeysModel} from "./dynamodb-keys.model";

/**
 * Model representing the DynamoDb filed of the DynamoDb event payload.
 */
export class DynamodbModel {
    keys: any;
    newImage?: any;
    oldImage?: any;
    sequenceNumber: string;
    sizeBytes: number;
    streamViewType: string;

    // Properties added to facilitate the manipulation
    tableName: string;
    parsedKeys: DynamodbKeysModel[] = [];
    parsedNewImage?: DynamodbKeysModel[];
    parsedOldImage?: DynamodbKeysModel[];
}
