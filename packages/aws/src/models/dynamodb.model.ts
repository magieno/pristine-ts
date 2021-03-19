import {DynamodbKeysModel} from "./dynamodb-keys.model";

export class DynamodbModel {
    keys: any;
    newImage?: any;
    oldImage?: any;
    sequenceNumber: string;
    sizeBytes: number;
    streamViewType: string;

    // Properties added to facilitate the manipulation
    tableName: string;
    parsedKeys: DynamodbKeysModel[];
    parsedNewImage?: DynamodbKeysModel[];
    parsedOldImage?: DynamodbKeysModel[];
}
