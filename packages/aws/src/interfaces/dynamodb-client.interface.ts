import {DynamoDB} from "@aws-sdk/client-dynamodb";
import {DataMapper, StringToAnyObjectMap} from "@awslabs-community-fork/dynamodb-data-mapper";
import {ZeroArgumentsConstructor} from "@awslabs-community-fork/dynamodb-data-marshaller";

export interface DynamodbClientInterface {
    getClient(): Promise<DynamoDB>

    getMapperClient(): Promise<DataMapper>

    get<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>, primaryKeyAndValue: { [key: string]: string }): Promise<T>

    list<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>): Promise<T[]>

    create<T extends StringToAnyObjectMap>(item: T): Promise<T>

    update<T extends StringToAnyObjectMap>(item: T): Promise<T>

    put<T extends StringToAnyObjectMap>(item: T): Promise<T>

    delete<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>, primaryKeyAndValue: { [key: string]: string }): Promise<void>

    findBySecondaryIndex<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>, keyCondition: { [propertyName: string]: string | boolean | number }, secondaryIndexName: string, filterKeysAndValues?: { [key: string]: string | number | boolean | string[] | number[] }, expiresAtFilter?: { [key: string]: number | Date }): Promise<T[]>
}
