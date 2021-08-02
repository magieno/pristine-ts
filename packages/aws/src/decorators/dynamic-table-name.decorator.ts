import {DynamicTableNameModel} from "../models/dynamic-table-name.model";

export const dynamicTableNameRegistry: DynamicTableNameModel[] = [];

/**
 * This decorator is to be put on a class that will be used with DynamoDb.
 * This registry will be used to set the DynamoDbTable Symbol of the class to the value that the token resolves to.
 * This will be done in the after init of the Aws module.
 * @param name The name of the variable in the container containing the name of the table.
 */
export const dynamicTableName = (name: string) => {
    return (constructor: any) => {
        dynamicTableNameRegistry.push({
            tokenName: name,
            classConstructor: constructor,
        });
    }
}
