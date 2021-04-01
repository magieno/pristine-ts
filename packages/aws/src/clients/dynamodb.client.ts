import DynamoDB from "aws-sdk/clients/dynamodb";
//todo: Create a fork with fixes
import {DataMapper, QueryOptions, StringToAnyObjectMap} from "@aws/dynamodb-data-mapper";
import {ZeroArgumentsConstructor} from "@aws/dynamodb-data-marshaller";
import {ConditionExpression, equals, greaterThan, OrExpression} from "@aws/dynamodb-expressions";
import {inject, injectable} from "tsyringe";
import {DynamodbItemNotFoundError} from "../errors/dynamodb-item-not-found.error";
import {DynamodbItemAlreadyExistsError} from "../errors/dynamodb-item-already-exists.error";
import {DynamodbTableNotFoundError} from "../errors/dynamodb-table-not-found.error";
import {DynamodbValidationError} from "../errors/dynamodb-validation.error";
import {DynamodbError} from "../errors/dynamodb.error";


@injectable()
export class DynamodbClient {

    private client: any;
    private documentClient: any;
    private mapperClient: any;

    constructor(
        @inject("%pristine.aws.region%") private readonly region: string,
    ) {
    }

    public async getClient(): Promise<DynamoDB> {
        return this.client = this.client ?? new DynamoDB({region: this.region});
    }

    public async getDocumentClient(): Promise<DynamoDB.DocumentClient> {
        return this.documentClient = this.documentClient ?? new DynamoDB.DocumentClient({region: this.region});
    }

    public async getMapperClient(): Promise<DataMapper> {
        return this.mapperClient = this.mapperClient ?? new DataMapper({client: await this.getClient()});
    }

    public async get<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>, primaryKeyAndValue: {[key: string]: string}): Promise<T> {
        try {
            let item = this.createItemOfClassWithPrimaryKey(classType, primaryKeyAndValue);
            item = await (await this.getMapperClient()).get(item);
            return item;
        } catch (exception) {
            throw this.convertError(exception);
        }
    }

    public async list<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>): Promise<T[]> {
        try {
            const iterator = (await this.getMapperClient()).scan(classType);
            const items: T[] = [];

            for await (const item of iterator) {
                items.push(item);
            }

            return items;
        } catch (e) {
            throw this.convertError(e);
        }
    }

    public async create<T extends StringToAnyObjectMap>(item: T): Promise<T> {
        try {
            const fetchedItem = await (await this.getMapperClient()).get(item);
            // If we get here without throwing then we found an item.
            throw new DynamodbItemAlreadyExistsError();
        } catch (error) {
            error = this.convertError(error);
            if (error instanceof DynamodbItemNotFoundError) {
                try {
                    item = await (await this.getMapperClient()).put(item);
                    return item;
                } catch (e) {
                    throw this.convertError(e);
                }
            }

            throw error;
        }
    }

    public async update<T extends StringToAnyObjectMap>(item: T): Promise<T> {
        try {
            item = await (await this.getMapperClient()).update(item);
            return item;
        } catch (err) {
            throw this.convertError(err);
        }
    }

    /**
     * Put (create or replace) item.
     */
    public async put<T extends StringToAnyObjectMap>(item: T): Promise<T> {
        try {
            item = await (await this.getMapperClient()).put(item);
            return item;
        } catch (err) {
            throw this.convertError(err);
        }
    }

    public async delete<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>, primaryKeyAndValue: {[key: string]: string}): Promise<void> {
        try {
            const item = this.createItemOfClassWithPrimaryKey(classType, primaryKeyAndValue);
            await (await this.getMapperClient()).delete(item);
            return;
        } catch (e) {
            throw this.convertError(e);
        }
    }

    public async findBySecondaryIndex<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>, keyCondition: { [propertyName: string]: string | boolean | number }, secondaryIndexName: string, filterKeysAndValues?: { [key: string]: string | number | boolean | string[] | number[]}, expiresAtFilter?: { [key: string]: number | Date }): Promise<T[]> {
        try {
            const filterExpression = this.createFilterExpression(filterKeysAndValues, expiresAtFilter);

            const queryOptions: QueryOptions = {indexName: secondaryIndexName, filter: filterExpression};

            const iterator = (await this.getMapperClient()).query(classType, keyCondition, queryOptions);
            const items: T[] = [];

            for await (const item of iterator) {
                items.push(item);
            }
            return items;
        } catch (e) {
            throw this.convertError(e);
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

    private convertError(error: Error): Error {
        if(error instanceof DynamodbError){
            return error;
        }
        if (error.hasOwnProperty("name") === true) {
            switch (error.name){
                case "ResourceNotFoundException":
                    return new DynamodbTableNotFoundError();
                case "ItemNotFoundException":
                    return new DynamodbItemNotFoundError();
                case "ValidationException":
                    return new DynamodbValidationError();
                default:
                    return new DynamodbError("Unknown dynamodb error: " + error.name);
            }
        }
        return new DynamodbError("Unknown dynamodb error");
    }

    private createItemOfClassWithPrimaryKey<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>, primaryKeyAndValue: {[key: string]: string}): T {
        const item: T = new classType();
        const primaryKeyName: string = Object.keys(primaryKeyAndValue)[0];
        // @ts-ignore
        item[primaryKeyName] = primaryKeyAndValue[primaryKeyName];

        return item;
    }
}
