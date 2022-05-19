import { ListOptions } from "./list.options";

/**
 * Options object to use when using FindBySecondaryIndex Dynamodb query.
 * It extends ListOptions because FindBySecondaryIndex returns a list.
 */
export interface FindBySecondaryIndexOptions<T> extends ListOptions<T> {
    /**
     * The key condition for the secondary index. (ie: {secondaryId: value}).
     */
    keyCondition: { [propertyName: string]: string | boolean | number },

    /**
     * The name of the secondary index in DynamoDb.
     */
    secondaryIndexName: string,

    /**
     * A map containing the filters keys and values to apply when listing by secondary index. Every key in the map represents an AND and the values represent ORs.  (ie: {filterKey1: filterValue, filterKey2: [value1, value1]} means you need filterKey1 to equal filterValue AND filterKey2 to equal value1 OR value2)
     */
    filterKeysAndValues?: { [key: string]: string | number | boolean | string[] | number[]},

    /**
     * A filter to get only the ones that the expiration is later then the value. Can either be a Date or a number representing the timestamp in seconds. (ie: {expiresAt: new Date()})
     */
    expiresAtFilter?: { [key: string]: number | Date },
}
