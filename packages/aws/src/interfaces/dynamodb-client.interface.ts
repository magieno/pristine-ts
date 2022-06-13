import {DynamoDB} from "@aws-sdk/client-dynamodb";
import {DataMapper, StringToAnyObjectMap} from "@awslabs-community-fork/dynamodb-data-mapper";
import {ZeroArgumentsConstructor} from "@awslabs-community-fork/dynamodb-data-marshaller";
import { ListOptions } from "../options/list.options";
import { FindBySecondaryIndexOptions } from "../options/find-by-secondary-index.options";
import { ListResult } from "../results/list.result";

/**
 * The DynamodbClient Interface defines the methods that a Dynamodb Client must implement.
 * When injecting the Dynamodb client the 'DynamodbClientInterface' tag should be used.
 */
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
    get<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>, primaryKeyAndValue: { [key: string]: string }): Promise<T | null>

    /**
     * Lists all the objects of a type (table).
     * @param options The options to use to list.
     */
    list<T extends StringToAnyObjectMap>(options: ListOptions<T>): Promise<ListResult<T>>

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
     * @param options The options to use.
     */
    findBySecondaryIndex<T extends StringToAnyObjectMap>(options: FindBySecondaryIndexOptions<T>): Promise<ListResult<T>>
}
