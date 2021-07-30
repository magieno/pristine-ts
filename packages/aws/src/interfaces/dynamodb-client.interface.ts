import {DynamoDB} from "@aws-sdk/client-dynamodb";
import {DataMapper, StringToAnyObjectMap} from "@awslabs-community-fork/dynamodb-data-mapper";
import {ZeroArgumentsConstructor} from "@awslabs-community-fork/dynamodb-data-marshaller";

export interface DynamodbClientInterface {
    /**
     * Returns the DynamoDB client from the @aws-sdk/client-dynamodb library
     */
    getClient(): Promise<DynamoDB>

    /**
     * Returns the mapper client from the @awslabs-community-fork/dynamodb-data-mapper library
     */
    getMapperClient(): Promise<DataMapper>

    /**
     * Gets an object from Dynamodb.
     * @param classType The class type of the object to be retrieved.
     * @param primaryKeyAndValue An object containing the primary key and the value of the object to get. (ie: {id: value})
     */
    get<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>, primaryKeyAndValue: { [key: string]: string }): Promise<T>

    /**
     * Lists all the objects of a type (table).
     * @param classType The class type to list all the objects for.
     */
    list<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>): Promise<T[]>

    /**
     * Creates an entry in DynamoDb if this id does not already exist.
     * @param item The item to create.
     */
    create<T extends StringToAnyObjectMap>(item: T): Promise<T>

    /**
     * Updates an item based on the hashkey.
     * @param item The item to update.
     */
    update<T extends StringToAnyObjectMap>(item: T): Promise<T>

    /**
     * Puts (create or replace) item.
     * @param item The item.
     */
    put<T extends StringToAnyObjectMap>(item: T): Promise<T>

    /**
     * Deletes an item.
     * @param classType The class type of the item to delete.
     * @param primaryKeyAndValue An object containing the primary key and the value of this key of the object to delete. (ie: {id: value})
     */
    delete<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>, primaryKeyAndValue: { [key: string]: string }): Promise<void>

    /**
     * Lists the item by secondary index.
     * @param classType The type of the class of the items to list.
     * @param keyCondition The key condition for the secondary index. (ie: {secondaryId: value}).
     * @param secondaryIndexName The name of the secondary index in DynamoDb.
     * @param filterKeysAndValues A map containing the filters keys and values to apply when listing by secondary index. Every key in the map represents an AND and the values represent ORs.  (ie: {filterKey1: filterValue, filterKey2: [value1, value1]} means you need filterKey1 to equal filterValue AND filterKey2 to equal value1 OR value2)
     * @param expiresAtFilter A filter to get only the ones that the expiration is later then the value. Can either be a Date or a number representing the timestamp in seconds. (ie: {expiresAt: new Date()}).
     */
    findBySecondaryIndex<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>, keyCondition: { [propertyName: string]: string | boolean | number }, secondaryIndexName: string, filterKeysAndValues?: { [key: string]: string | number | boolean | string[] | number[] }, expiresAtFilter?: { [key: string]: number | Date }): Promise<T[]>
}
