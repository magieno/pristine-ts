import {DynamoDB} from "@aws-sdk/client-dynamodb";
import {DataMapper, DynamoDbTable, QueryOptions, StringToAnyObjectMap} from "@awslabs-community-fork/dynamodb-data-mapper";
import {ZeroArgumentsConstructor} from "@awslabs-community-fork/dynamodb-data-marshaller";
import {ConditionExpression, equals, greaterThan, OrExpression} from "@awslabs-community-fork/dynamodb-expressions";
import {inject, injectable} from "tsyringe";
import {DynamodbItemNotFoundError} from "../errors/dynamodb-item-not-found.error";
import {DynamodbItemAlreadyExistsError} from "../errors/dynamodb-item-already-exists.error";
import {DynamodbTableNotFoundError} from "../errors/dynamodb-table-not-found.error";
import {DynamodbValidationError} from "../errors/dynamodb-validation.error";
import {DynamodbError} from "../errors/dynamodb.error";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {tag} from "@pristine-ts/common";
import {DynamodbClientInterface} from "../interfaces/dynamodb-client.interface";
import {AwsModuleKeyname} from "../aws.module.keyname";

@tag("DynamodbClientInterface")
@injectable()
export class DynamodbClient implements DynamodbClientInterface{

    private client: any;
    private documentClient: any;
    private mapperClient: any;

    constructor(
        @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
        @inject("%pristine.aws.region%") private readonly region: string,
    ) {
    }

    public async getClient(): Promise<DynamoDB> {
        return this.client = this.client ?? new DynamoDB({region: this.region});
    }

    public async getMapperClient(): Promise<DataMapper> {
        return this.mapperClient = this.mapperClient ?? new DataMapper({client: await this.getClient()});
    }

    private getTableName(classTypeProtoype: any): string {
        return classTypeProtoype[DynamoDbTable]
    }

    public async get<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>, primaryKeyAndValue: {[key: string]: string}): Promise<T> {
        try {
            let item = this.createItemOfClassWithPrimaryKey(classType, primaryKeyAndValue);
            item = await (await this.getMapperClient()).get(item);
            this.logHandler.debug("DYNAMODB CLIENT - Got item", {item}, AwsModuleKeyname);
            return item;
        } catch (error) {
            error = this.convertError(error, this.getTableName(classType.prototype), Object.keys(primaryKeyAndValue)[0]);
            if (error instanceof DynamodbItemNotFoundError) {
                this.logHandler.warning("DYNAMODB CLIENT - Error getting", {error, classType, primaryKeyAndValue}, AwsModuleKeyname);
            } else {
                this.logHandler.error("DYNAMODB CLIENT - Error getting", {error, classType, primaryKeyAndValue}, AwsModuleKeyname);
            }
            throw error;
        }
    }

    public async list<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>): Promise<T[]> {
        try {
            const iterator = (await this.getMapperClient()).scan(classType);
            const items: T[] = [];

            for await (const item of iterator) {
                items.push(item);
            }
            this.logHandler.debug("DYNAMODB CLIENT - List items", {items}, AwsModuleKeyname);

            return items;
        } catch (error) {
            error = this.convertError(error, this.getTableName(classType.prototype));
            this.logHandler.error("DYNAMODB CLIENT - Error listing", {error, classType}, AwsModuleKeyname)
            throw error;
        }
    }

    public async create<T extends StringToAnyObjectMap>(item: T): Promise<T> {
        try {
            const fetchedItem = await (await this.getMapperClient()).get(item);
            // If we get here without throwing then we found an item.
            throw new DynamodbItemAlreadyExistsError();
        } catch (error) {
            error = this.convertError(error, this.getTableName(item.constructor.prototype));
            if (error instanceof DynamodbItemNotFoundError) {
                try {
                    item = await (await this.getMapperClient()).put(item);
                    this.logHandler.debug("DYNAMODB CLIENT - Created item", {item}, AwsModuleKeyname);

                    return item;
                } catch (e) {
                    e = this.convertError(e, this.getTableName(item.constructor.prototype));
                    this.logHandler.error("DYNAMODB CLIENT - Error creating", {e, item}, AwsModuleKeyname);
                    throw e;
                }
            }

            throw error;
        }
    }

    public async update<T extends StringToAnyObjectMap>(item: T): Promise<T> {
        try {
            item = await (await this.getMapperClient()).update(item);
            this.logHandler.debug("DYNAMODB CLIENT - Updated item", {item}, AwsModuleKeyname);

            return item;
        } catch (error) {
            //TODO: Get the primary key.
            error = this.convertError(error, this.getTableName(item.constructor.prototype));
            this.logHandler.error("DYNAMODB CLIENT - Error updating", {error, item}, AwsModuleKeyname)
            throw error;
        }
    }

    /**
     * Put (create or replace) item.
     */
    public async put<T extends StringToAnyObjectMap>(item: T): Promise<T> {
        try {
            item = await (await this.getMapperClient()).put(item);
            this.logHandler.debug("DYNAMODB CLIENT - Put item", {item}, AwsModuleKeyname);

            return item;
        } catch (error) {
            error = this.convertError(error, this.getTableName(item.constructor.prototype));
            this.logHandler.error("DYNAMODB CLIENT - Error putting", {error, item}, AwsModuleKeyname)
            throw error;
        }
    }

    public async delete<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>, primaryKeyAndValue: {[key: string]: string}): Promise<void> {
        try {
            const item = this.createItemOfClassWithPrimaryKey(classType, primaryKeyAndValue);
            await (await this.getMapperClient()).delete(item);
            this.logHandler.debug("DYNAMODB CLIENT - Deleted item", {item}, AwsModuleKeyname);

            return;
        } catch (error) {
            error = this.convertError(error, this.getTableName(classType.prototype), Object.keys(primaryKeyAndValue)[0]);
            this.logHandler.error("DYNAMODB CLIENT - Error deleting", {error, classType, primaryKeyAndValue}, AwsModuleKeyname)
            throw error;
        }
    }

    public async findBySecondaryIndex<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>, keyCondition: { [propertyName: string]: string | boolean | number }, secondaryIndexName: string, filterKeysAndValues?: { [key: string]: string | number | boolean | string[] | number[]}, expiresAtFilter?: { [key: string]: number | Date }): Promise<T[]> {
        try {
            const filterExpression = this.createFilterExpression(filterKeysAndValues, expiresAtFilter);

            const queryOptions: QueryOptions = {indexName: secondaryIndexName, filter: filterExpression};

            this.logHandler.debug("DYNAMODB CLIENT - Querying with options", {queryOptions, keyCondition}, AwsModuleKeyname);
            const iterator = (await this.getMapperClient()).query(classType, keyCondition, queryOptions);
            const items: T[] = [];

            for await (const item of iterator) {
                items.push(item);
            }
            this.logHandler.debug("DYNAMODB CLIENT - Found items", {items}, AwsModuleKeyname);

            return items;
        } catch (error) {
            error = this.convertError(error, this.getTableName(classType.prototype));
            this.logHandler.error("DYNAMODB CLIENT - Error finding by secondary index", {error, classType, keyCondition, secondaryIndexName, filterKeysAndValues, expiresAtFilter}, AwsModuleKeyname)
            throw error;
        }
    }

    private createFilterConditions(filterKeysAndValues: { [key: string]: string | number | boolean | string[] | number[]}): ConditionExpression[]{
        const conditions: ConditionExpression[] =  [];

        // Every key will represent an AND condition when merged with the expires at filter.
        for (const key in filterKeysAndValues) {
            if (filterKeysAndValues.hasOwnProperty(key)) {

                // Every value for one key represents an OR condition.
                if (Array.isArray(filterKeysAndValues[key])) {
                    const orExpressions: ConditionExpression[] = [];
                    for (const value of filterKeysAndValues[key] as []) {
                        orExpressions.push({
                            ...equals(value),
                            subject: key,
                        });
                    }
                    const orExpression: OrExpression = {
                        type: "Or",
                        conditions: orExpressions,
                    };
                    conditions.push(orExpression);
                } else {
                    conditions.push({
                        ...equals(filterKeysAndValues[key]),
                        subject: key,
                    });
                }
            }
        }
        return conditions;
    }

    private createFilterExpression(filterKeysAndValues?: { [key: string]: string | number | boolean | string[] | number[]}, expiresAtFilter?: { [key: string]: number | Date }): ConditionExpression | undefined {

        const conditions: ConditionExpression[] = []

        if(filterKeysAndValues){
            conditions.push(...this.createFilterConditions(filterKeysAndValues));
        }

        if (expiresAtFilter) {
            conditions.push(this.createExpiresAtFilter(expiresAtFilter));
        }

        // If we only have one condition we do not create an AND expression.
        let filterExpression: ConditionExpression | undefined;
        if (conditions.length === 1) {
            filterExpression = conditions[0];
        } else if (conditions.length > 1) {
            filterExpression = {
                type: "And",
                conditions,
            };
        }

        return filterExpression;
    }

    private createExpiresAtFilter(expiresAtFilter: { [key: string]: number | Date }): ConditionExpression {
        let value = expiresAtFilter[Object.keys(expiresAtFilter)[0]];
        value = value instanceof Date ? Math.floor(value.getTime() / 1000) : value;
        const greaterThanExpression: ConditionExpression = {
            ...greaterThan(value),
            subject: Object.keys(expiresAtFilter)[0],
        };

        return greaterThanExpression;
    }

    private convertError(error: Error, tableName?: string, primaryKey?: string): Error {
        this.logHandler.debug("Converting error to dynamodb error.", {error, tableName, primaryKey}, AwsModuleKeyname);
        if(error instanceof DynamodbError){
            return error;
        }
        if (error.hasOwnProperty("name") === true) {
            switch (error.name){
                case "ResourceNotFoundException":
                    return new DynamodbTableNotFoundError(error, tableName);
                case "ItemNotFoundException":
                    return new DynamodbItemNotFoundError(error, tableName, primaryKey);
                case "ValidationException":
                    return new DynamodbValidationError(error, tableName, primaryKey);
                default:
                    return new DynamodbError("Unknown dynamodb error: " + error.name, error, tableName, primaryKey);
            }
        }
        return new DynamodbError("Unknown dynamodb error", error, tableName, primaryKey);
    }

    private createItemOfClassWithPrimaryKey<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>, primaryKeyAndValue: {[key: string]: string}): T {
        const item: T = new classType();
        const primaryKeyName: string = Object.keys(primaryKeyAndValue)[0];
        // @ts-ignore
        item[primaryKeyName] = primaryKeyAndValue[primaryKeyName];

        return item;
    }
}
