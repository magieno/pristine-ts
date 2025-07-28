import {DynamoDB} from "@aws-sdk/client-dynamodb";
import {DataMapper, StringToAnyObjectMap} from "@awslabs-community-fork/dynamodb-data-mapper";
import {ZeroArgumentsConstructor} from "@awslabs-community-fork/dynamodb-data-marshaller";
import {ListOptions} from "../options/list.options";
import {FindBySecondaryIndexOptions} from "../options/find-by-secondary-index.options";
import {ListResult} from "../results/list.result";

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
   * @param additionalOptions The object containing additionalOptions for the query
   */
  get<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>, primaryKeyAndValue: {
    [key: string]: string
  }, additionalOptions?: { eventId?: string, eventGroupId?: string }): Promise<T | null>

  /**
   * Lists all the objects of a type (table).
   * @param options The options to use to list.
   * @param additionalOptions
   */
  list<T extends StringToAnyObjectMap>(options: ListOptions<T>, additionalOptions?: {
    eventId?: string,
    eventGroupId?: string
  }): Promise<ListResult<T>>

  /**
   * Creates an entry in DynamoDb if this id does not already exist.
   * @param item The item to create.
   * @param additionalOptions
   */
  create<T extends StringToAnyObjectMap>(item: T, additionalOptions?: {
    eventId?: string,
    eventGroupId?: string
  }): Promise<T>

  /**
   * Updates an item based on the hashkey.
   * @param item The item to update.
   * @param additionalOptions
   */
  update<T extends StringToAnyObjectMap>(item: T, additionalOptions?: {
    eventId?: string,
    eventGroupId?: string
  }): Promise<T>

  /**
   * Puts (create or replace) item.
   * @param item The item.
   * @param additionalOptions
   */
  put<T extends StringToAnyObjectMap>(item: T, additionalOptions?: {
    eventId?: string,
    eventGroupId?: string
  }): Promise<T>

  /**
   * Deletes an item.
   * @param classType The class type of the item to delete.
   * @param primaryKeyAndValue An object containing the primary key and the value of this key of the object to delete. (ie: {id: value})
   * @param additionalOptions
   */
  delete<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>, primaryKeyAndValue: {
    [key: string]: string
  }, additionalOptions?: { eventId?: string, eventGroupId?: string }): Promise<void>

  /**
   * Lists the item by secondary index.
   * @param options The options to use.
   * @param additionalOptions
   */
  findBySecondaryIndex<T extends StringToAnyObjectMap>(options: FindBySecondaryIndexOptions<T>, additionalOptions?: {
    eventId?: string,
    eventGroupId?: string
  }): Promise<ListResult<T>>
}
