import {DynamicTableNameModel} from "../models/dynamic-table-name.model";

export const dynamicTableNameRegistry: DynamicTableNameModel[] = [];

export const dynamicTableName = (name: string) => {
    return (constructor: any) => {
        dynamicTableNameRegistry.push({
            name,
            classConstructor: constructor,
        });
    }
}
