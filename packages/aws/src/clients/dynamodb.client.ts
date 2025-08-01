import {DynamoDB} from "@aws-sdk/client-dynamodb";
import {
  DataMapper,
  DynamoDbTable,
  QueryOptions,
  ScanOptions,
  StringToAnyObjectMap
} from "@awslabs-community-fork/dynamodb-data-mapper";
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
import {ListOptions} from "../options/list.options";
import {FindBySecondaryIndexOptions} from "../options/find-by-secondary-index.options";
import {ListResult} from "../results/list.result";
import {DynamodbSortOrderEnum} from "../enums/dynamodb-sort-order.enum";

/**
 * The client to use to interact with AWS DynamoDb. It is a wrapper around the client of @aws-sdk/client-dynamodb.
 * It is tagged so it can be injected using DynamodbClientInterface.
 */
@tag("DynamodbClientInterface")
@injectable()
export class DynamodbClient implements DynamodbClientInterface {

  /**
   * The instantiated client from the @aws-sdk/client-dynamodb library.
   * @private
   */
  private client: DynamoDB;

  /**
   * The instantiated mapper client from the @awslabs-community-fork/dynamodb-data-mapper library.
   * @private
   */
  private mapperClient: any;

  /**
   * The client to use to interact with DynamoDb. It is a wrapper around the client of @aws-sdk/client-dynamodb.
   * @param logHandler The log handler used to output logs.
   * @param region The aws region for which the client will be used.
   */
  constructor(
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    @inject("%pristine.aws.region%") private readonly region: string,
  ) {
  }

  /**
   * Returns the DynamoDB client from the @aws-sdk/client-dynamodb library
   */
  public async getClient(): Promise<DynamoDB> {
    return this.client = this.client ?? new DynamoDB({region: this.region});
  }

  /**
   * Returns the mapper client from the @awslabs-community-fork/dynamodb-data-mapper library
   */
  public async getMapperClient(): Promise<DataMapper> {
    return this.mapperClient = this.mapperClient ?? new DataMapper({client: await this.getClient()});
  }

  /**
   * Gets an object from Dynamodb. Returns null if the item was not found.
   * @param classType The class type of the object to be retrieved.
   * @param primaryKeyAndValue An object containing the primary key and the value of the object to get. (ie: {id: value})
   * @param additionalOptions
   */
  public async get<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>, primaryKeyAndValue: {
    [key: string]: string
  }, additionalOptions?: { eventId?: string, eventGroupId?: string }): Promise<T | null> {
    try {
      let item = this.createItemOfClassWithPrimaryKey(classType, primaryKeyAndValue);
      item = await (await this.getMapperClient()).get(item);
      this.logHandler.debug("DynamodbClient: Got item from dynamodb.", {
        highlights: {
          id: primaryKeyAndValue,
        },
        extra: {item},
        eventId: additionalOptions?.eventId,
        eventGroupId: additionalOptions?.eventGroupId,
      });
      return item;
    } catch (error: any) {
      error = this.convertError(error, this.getTableName(classType.prototype), Object.keys(primaryKeyAndValue)[0]);
      if (error instanceof DynamodbItemNotFoundError) {
        this.logHandler.warning("DynamodbClient: Error getting item from dynamodb.", {
          highlights: {
            id: primaryKeyAndValue,
            errorMessage: error.message,
          },
          extra: {error, classType, primaryKeyAndValue},
          eventId: additionalOptions?.eventId,
          eventGroupId: additionalOptions?.eventGroupId,
        });
        return null;
      } else {
        this.logHandler.error("DynamodbClient: Error getting item from dynamodb.", {
          highlights: {
            id: primaryKeyAndValue,
            errorMessage: error.message,
          },
          extra: {error, classType, primaryKeyAndValue},
          eventId: additionalOptions?.eventId,
          eventGroupId: additionalOptions?.eventGroupId,
        });
      }
      throw error;
    }
  }

  /**
   * Lists all the objects of a type (table).
   * @param options The options to use to list.
   * @param additionalOptions
   */
  public async list<T extends StringToAnyObjectMap>(options: ListOptions<T>, additionalOptions?: {
    eventId?: string,
    eventGroupId?: string
  }): Promise<ListResult<T>> {
    try {
      let scanOptions: ScanOptions | undefined;
      if (options.pagination) {
        scanOptions = {
          startKey: options.pagination.startKey,
          pageSize: options.pagination.pageSize
        }
      }
      const iterator = (await this.getMapperClient()).scan(options.classType, scanOptions);
      const paginator = iterator.pages();

      const items: T[] = [];
      for await (const page of paginator) {
        items.push(...page);

        if (options.pagination?.pageSize) {
          break;
        }
      }

      this.logHandler.debug("DynamodbClient: List items from dynamodb.", {
        highlights: {
          count: items.length,
        },
        extra: {items},
        eventId: additionalOptions?.eventId,
        eventGroupId: additionalOptions?.eventGroupId,
      });

      const paginationResult = {
        count: paginator.count,
        lastEvaluatedKey: paginator.lastEvaluatedKey,
      }

      return new ListResult<T>(items, paginationResult);
    } catch (error: any) {
      error = this.convertError(error, this.getTableName(options.classType.prototype));
      this.logHandler.error("DynamodbClient: Error listing items from dynamodb.", {
        highlights: {
          errorMessage: error.message,
        },
        extra: {error, options},
        eventId: additionalOptions?.eventId,
        eventGroupId: additionalOptions?.eventGroupId,
      });
      throw error;
    }
  }

  /**
   * Creates an entry in DynamoDb if this id does not already exist.
   * @param item The item to create.
   * @param additionalOptions
   */
  public async create<T extends StringToAnyObjectMap>(item: T, additionalOptions?: {
    eventId?: string,
    eventGroupId?: string
  }): Promise<T> {
    try {
      const fetchedItem = await (await this.getMapperClient()).get(item);
      // If we get here without throwing then we found an item.
      throw new DynamodbItemAlreadyExistsError();
    } catch (error: any) {
      error = this.convertError(error, this.getTableName(item.constructor.prototype));
      if (error instanceof DynamodbItemNotFoundError) {
        try {
          item = await (await this.getMapperClient()).put(item);
          this.logHandler.debug("DynamodbClient: Created item in dynamodb.", {
            highlights: {
              id: item.id,
            },
            extra: {item},
            eventId: additionalOptions?.eventId,
            eventGroupId: additionalOptions?.eventGroupId,
          });

          return item;
        } catch (error: any) {
          error = this.convertError(error, this.getTableName(item.constructor.prototype));
          this.logHandler.error("DynamodbClient: Error creating item in dynamodb.", {
            highlights: {

              id: item.id,
              errorMessage: error.message,
            },
            extra: {error, item},
            eventId: additionalOptions?.eventId,
            eventGroupId: additionalOptions?.eventGroupId,
          });
          throw error;
        }
      }

      throw error;
    }
  }

  /**
   * Updates an item based on the hashkey.
   * @param item The item to update.
   * @param additionalOptions
   */
  public async update<T extends StringToAnyObjectMap>(item: T, additionalOptions?: {
    eventId?: string,
    eventGroupId?: string
  }): Promise<T> {
    try {
      item = await (await this.getMapperClient()).update(item);
      this.logHandler.debug("DynamodbClient: Updated item in dynamodb.", {
        highlights: {

          id: item.id,
        },
        extra: {item},
        eventId: additionalOptions?.eventId,
        eventGroupId: additionalOptions?.eventGroupId,
      });

      return item;
    } catch (error: any) {
      //TODO: Get the primary key.
      error = this.convertError(error, this.getTableName(item.constructor.prototype));
      this.logHandler.error("DynamodbClient: Error updating item in dynamodb.", {
        highlights: {

          id: item.id,
          errorMessage: error.message,
        },
        extra: {error, item},
        eventId: additionalOptions?.eventId,
        eventGroupId: additionalOptions?.eventGroupId,
      })
      throw error;
    }
  }

  /**
   * Puts (create or replace) item.
   * @param item The item.
   * @param additionalOptions
   */
  public async put<T extends StringToAnyObjectMap>(item: T, additionalOptions?: {
    eventId?: string,
    eventGroupId?: string
  }): Promise<T> {
    try {
      item = await (await this.getMapperClient()).put(item);
      this.logHandler.debug("DynamodbClient: Put item in dynamodb.", {
        highlights: {

          id: item.id,
        },
        extra: {item},
        eventId: additionalOptions?.eventId,
        eventGroupId: additionalOptions?.eventGroupId,
      });

      return item;
    } catch (error: any) {
      error = this.convertError(error, this.getTableName(item.constructor.prototype));
      this.logHandler.error("DynamodbClient: Error putting item in dynamodb.", {
        highlights: {

          id: item.id,
          errorMessage: error.message,
        },
        extra: {error, item},
        eventId: additionalOptions?.eventId,
        eventGroupId: additionalOptions?.eventGroupId,
      })
      throw error;
    }
  }

  /**
   * Deletes an item.
   * @param classType The class type of the item to delete.
   * @param primaryKeyAndValue An object containing the primary key and the value of this key of the object to delete. (ie: {id: value})
   * @param additionalOptions
   */
  public async delete<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>, primaryKeyAndValue: {
    [key: string]: string
  }, additionalOptions?: { eventId?: string, eventGroupId?: string }): Promise<void> {
    try {
      const item = this.createItemOfClassWithPrimaryKey(classType, primaryKeyAndValue);
      await (await this.getMapperClient()).delete(item);
      this.logHandler.debug("DynamodbClient: Deleted item from dynamodb.", {
        highlights: {
          id: primaryKeyAndValue,
        },
        extra: {item},
        eventId: additionalOptions?.eventId,
        eventGroupId: additionalOptions?.eventGroupId,
      });

      return;
    } catch (error: any) {
      error = this.convertError(error, this.getTableName(classType.prototype), Object.keys(primaryKeyAndValue)[0]);
      this.logHandler.error("DynamodbClient: Error deleting item from dynamodb.", {
        highlights: {
          id: primaryKeyAndValue,
          errorMessage: error.message,
        },
        extra: {error, classType, primaryKeyAndValue},
        eventId: additionalOptions?.eventId,
        eventGroupId: additionalOptions?.eventGroupId,
      })
      throw error;
    }
  }

  /**
   * Lists the item by secondary index.
   * @param options The options to use.
   * @param additionalOptions
   */
  public async findBySecondaryIndex<T extends StringToAnyObjectMap>(options: FindBySecondaryIndexOptions<T>, additionalOptions?: {
    eventId?: string,
    eventGroupId?: string
  }): Promise<ListResult<T>> {
    try {
      const filterExpression = this.createFilterExpression(options.filterKeysAndValues, options.expiresAtFilter);

      const queryOptions: QueryOptions = {indexName: options.secondaryIndexName, filter: filterExpression};

      if (options.pagination) {
        queryOptions.pageSize = options.pagination.pageSize;
        queryOptions.startKey = options.pagination.startKey;
      }
      // Makes the default scanIndexForward = false so that most recent come first.
      queryOptions.scanIndexForward = options?.pagination?.order === DynamodbSortOrderEnum.Asc;

      this.logHandler.debug("DynamodbClient: Querying with options.", {
        highlights: {
          secondaryIndexName: options.secondaryIndexName,
          keyCondition: options.keyCondition,
        },
        extra: {queryOptions, options},
        eventId: additionalOptions?.eventId,
        eventGroupId: additionalOptions?.eventGroupId,
      });
      const iterator = (await this.getMapperClient()).query(options.classType, options.keyCondition, queryOptions);
      const paginator = iterator.pages();

      const items: T[] = [];
      for await (const page of paginator) {
        items.push(...page);

        if (options.pagination?.pageSize) {
          break;
        }
      }

      this.logHandler.debug("DynamodbClient: Found items.", {
        highlights: {
          count: items.length,
        },
        extra: {items},
        eventId: additionalOptions?.eventId,
        eventGroupId: additionalOptions?.eventGroupId,
      });

      const paginationResult = {
        count: paginator.count,
        lastEvaluatedKey: paginator.lastEvaluatedKey,
      }
      return new ListResult<T>(items, paginationResult);
    } catch (error: any) {
      error = this.convertError(error, this.getTableName(options.classType.prototype));
      this.logHandler.error("DynamodbClient: Error finding by secondary index.", {
        highlights: {
          secondaryIndexName: options.secondaryIndexName,
          keyCondition: options.keyCondition,
          errorMessage: error.message,
        },
        extra: {error, options},
        eventId: additionalOptions?.eventId,
        eventGroupId: additionalOptions?.eventGroupId,
      })
      throw error;
    }
  }

  /**
   * Gets the table name from a class prototype.
   * @param classTypePrototype The class prototype containing a table name in the DynamoDbTable symbol
   * @private
   */
  private getTableName(classTypePrototype: any): string {
    return classTypePrototype[DynamoDbTable]
  }

  /**
   * Creates the filter conditions for DynamoDb.
   * @param filterKeysAndValues A map containing the filters keys and values to apply when listing by secondary index. Every key in the map represents an AND and the values represent ORs.  (ie: {filterKey1: filterValue, filterKey2: [value1, value1]} means you need filterKey1 to equal filterValue AND filterKey2 to equal value1 OR value2)
   * @private
   */
  private createFilterConditions(filterKeysAndValues: {
    [key: string]: string | number | boolean | string[] | number[]
  }): ConditionExpression[] {
    const conditions: ConditionExpression[] = [];

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

  /**
   * Creates the final expression containing all the conditions for DyanmoDb.
   * @param filterKeysAndValues A map containing the filters keys and values to apply when listing by secondary index. Every key in the map represents an AND and the values represent ORs.  (ie: {filterKey1: filterValue, filterKey2: [value1, value1]} means you need filterKey1 to equal filterValue AND filterKey2 to equal value1 OR value2)
   * @param expiresAtFilter A filter to get only the ones that the expiration is later then the value. Can either be a Date or a number representing the timestamp in seconds. (ie: {expiresAt: new Date()}).
   * @private
   */
  private createFilterExpression(filterKeysAndValues?: {
    [key: string]: string | number | boolean | string[] | number[]
  }, expiresAtFilter?: { [key: string]: number | Date }): ConditionExpression | undefined {

    const conditions: ConditionExpression[] = []

    if (filterKeysAndValues) {
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

  /**
   * Creates the dynamodb expression for the expires at filter
   * @param expiresAtFilter A filter to get only the ones that the expiration is later then the value. Can either be a Date or a number representing the timestamp in seconds. (ie: {expiresAt: new Date()}).
   * @private
   */
  private createExpiresAtFilter(expiresAtFilter: { [key: string]: number | Date }): ConditionExpression {
    let value = expiresAtFilter[Object.keys(expiresAtFilter)[0]];
    value = value instanceof Date ? Math.floor(value.getTime() / 1000) : value;
    const greaterThanExpression: ConditionExpression = {
      ...greaterThan(value),
      subject: Object.keys(expiresAtFilter)[0],
    };

    return greaterThanExpression;
  }

  /**
   * Converts an error from Dynamodb into a Pristine error type.
   * @param error The error to be converted.
   * @param tableName The table name on which the error happened
   * @param primaryKey The primary key of the item for which the error happened.
   * @private
   */
  private convertError(error: Error, tableName?: string, primaryKey?: string): Error {
    this.logHandler.debug("DynamodbClient: Converting error to dynamodb error.", {
      highlights: {
        tableName,
        primaryKey,
        errorMessage: error.message,
      },
      extra: {error, tableName, primaryKey}
    });
    if (error instanceof DynamodbError) {
      return error;
    }
    if (error.hasOwnProperty("name") === true) {
      switch (error.name) {
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

  /**
   * Creates an item based on the class type and the primary key and value.
   * @param classType The class type of the item.
   * @param primaryKeyAndValue An object representing the primary key and its value (ie: {id: value})
   * @private
   */
  private createItemOfClassWithPrimaryKey<T extends StringToAnyObjectMap>(classType: ZeroArgumentsConstructor<T>, primaryKeyAndValue: {
    [key: string]: string
  }): T {
    const item: T = new classType();
    const primaryKeyName: string = Object.keys(primaryKeyAndValue)[0];
    // @ts-ignore - We know by the type from Dynamodb that we can access it.
    item[primaryKeyName] = primaryKeyAndValue[primaryKeyName];

    return item;
  }
}
