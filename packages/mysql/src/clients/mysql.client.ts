import {inject, injectable, injectAll, singleton} from "tsyringe";
import {MysqlClientInterface} from "../interfaces/mysql-client.interface";
import {ClassMetadata, PropertyMetadata} from "@pristine-ts/metadata";
import {DecoratorMetadataKeynameEnum} from "../enums/decorator-metadata-keyname.enum";
import {TableDecoratorMetadataInterface} from "../interfaces/table-decorator-metadata.interface";
import {ColumnDecoratorMetadataInterface} from "../interfaces/column-decorator-metadata.interface";
import {createPool, Pool} from "mysql2/promise";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {DataMapper} from "@pristine-ts/data-mapping-common";
import {FilteringOperatorEnum, SearchQuery, SearchResult} from "@pristine-ts/mysql-common";
import {tag} from "@pristine-ts/common";
import {MysqlConfig} from "../configs/mysql.config";
import {MysqlConfigProviderInterface} from "../interfaces/mysql-config-provider.interface";

@tag("MysqlClientInterface")
@injectable()
@singleton()
export class MysqlClient implements MysqlClientInterface {
  private pools: Map<string, Pool> = new Map<string, Pool>();

  constructor(
    @injectAll("MysqlConfigProviderInterface") private readonly mysqlConfigProviders: MysqlConfigProviderInterface[],
    @inject('LogHandlerInterface') private readonly logHandler: LogHandlerInterface,
    private readonly dataMapper: DataMapper,
  ) {
  }

  /**
   * This method returns a pool of connections to the database.
   * @param configUniqueKeyname
   * @param force
   */
  async getPool(configUniqueKeyname: string, force: boolean = false, options?: {
    eventId?: string,
    eventGroupId?: string
  }): Promise<Pool> {
    if (!this.pools.has(configUniqueKeyname) && !force) {
      try {
        const mysqlConfig = await this.getMysqlConfig(configUniqueKeyname);

        const pool = createPool({
          connectionLimit: mysqlConfig.connectionLimit,
          host: mysqlConfig.host,
          port: mysqlConfig.port,
          user: mysqlConfig.user,
          password: mysqlConfig.password,
          database: mysqlConfig.database,
          debug: mysqlConfig.debug,
          multipleStatements: mysqlConfig.multipleStatements ?? false,
          ...options,
        });

        this.pools.set(configUniqueKeyname, pool);

        this.logHandler.debug('MysqlClient: MySql Adapter Pool generated successfully.', {
          eventId: options?.eventId,
          eventGroupId: options?.eventGroupId,
          extra: {
            mysqlConfig,
            pool,
          }
        });
      } catch (error) {
        this.logHandler.error("MysqlClient: Could not create the connection pool.", {
          eventId: options?.eventId,
          eventGroupId: options?.eventGroupId, highlights: {error}
        })

        throw error;
      }
    }

    return this.pools.get(configUniqueKeyname) as Pool;
  }

  /**
   * This method returns the table metadata for a given class.
   * @param classType
   */
  public getTableMetadata<T extends { [key: string]: any; }>(classType: {
    new(): T;
  }): TableDecoratorMetadataInterface {
    const tableMetadata: TableDecoratorMetadataInterface = ClassMetadata.getMetadata(classType, DecoratorMetadataKeynameEnum.Table);

    if (!tableMetadata) {
      throw new Error(`The class ${classType.name} does not have the @table decorator.`);
    }

    return tableMetadata;
  }

  /**
   * This method returns the columns metadata for a given class.
   * @param classType
   */
  public getColumnsMetadata<T extends { [key: string]: any; }>(classType: {
    new(): T;
  }): { [property in string]: ColumnDecoratorMetadataInterface } {
    const properties = ClassMetadata.getInformation(classType).properties;

    const columnsMetadata: { [property in string]: ColumnDecoratorMetadataInterface } = {};

    for (const property of properties) {
      const columnMetadata = this.getColumnMetadata(classType, property);

      if (columnMetadata) {
        columnsMetadata[property] = columnMetadata;
      }
    }

    return columnsMetadata;
  }

  /**
   * This method returns the column metadata for a given class and property name.
   * @param classType
   * @param propertyName
   */
  public getColumnMetadata<T extends { [key: string]: any; }>(classType: {
    new(): T;
  }, propertyName: string): ColumnDecoratorMetadataInterface {
    const metadata = PropertyMetadata.getMetadata(classType.prototype, propertyName, DecoratorMetadataKeynameEnum.Column);

    if (!metadata) {
      throw new Error(`The property ${propertyName} does not have the @column decorator.`);
    }

    return metadata;
  }

  /**
   * This method returns the primary key property name for a given class.
   * @param classType
   */
  public getPrimaryKeyPropertyName<T extends { [key: string]: any; }>(classType: { new(): T; }) {
    const columns = this.getColumnsMetadata(classType);

    let primaryKeyColumn: string | null = null;

    for (const column in columns) {
      if (columns[column].isPrimaryKey) {
        if (primaryKeyColumn) {
          throw new Error(`The class ${classType.name} has more than one primary key.`);
        }
        primaryKeyColumn = column;
      }
    }

    if (!primaryKeyColumn) {
      throw new Error(`The class ${classType.name} does not have a primary key.`);
    }

    return primaryKeyColumn;
  }

  /**
   * This method returns the primary key column name for a given class.
   * @param classType
   */
  public getPrimaryKeyColumnName<T extends { [key: string]: any; }>(classType: { new(): T; }) {
    return this.getColumnName(classType, this.getPrimaryKeyPropertyName(classType));
  }

  /**
   * This method returns the column name for a given class and property name.
   *
   * @param classType
   * @param propertyName
   */
  public getColumnName<T extends { [key: string]: any; }>(classType: { new(): T; }, propertyName: string): string {
    const columns = this.getColumnsMetadata(classType);

    const column = this.getColumnMetadata(classType, propertyName);

    if (column.name) {
      return column.name;
    }

    const tableMetadata = this.getTableMetadata(classType);

    if (tableMetadata.autoColumnNamingStrategy) {
      return tableMetadata.autoColumnNamingStrategy(propertyName);
    }

    return propertyName;
  }

  /**
   * This method returns the column name for a given class and property name.
   * @param configUniqueKeyname
   * @param sqlStatement
   * @param values
   */
  async executeSql(configUniqueKeyname: string, sqlStatement: string, values: any[], options?: {
    eventId?: string,
    eventGroupId?: string
  }): Promise<any> {
    const pool = await this.getPool(configUniqueKeyname);

    this.logHandler.debug("MysqlClient: Executing SQL statement.", {
      eventId: options?.eventId,
      eventGroupId: options?.eventGroupId,
      highlights: {sqlStatement, values}
    });

    try {
      const result = await pool.query(sqlStatement, values);

      this.logHandler.debug("MysqlClient: Successfully executed the SQL statement.", {
        eventId: options?.eventId, eventGroupId: options?.eventGroupId,
        highlights: {
          sqlStatement,
          values,
          result
        }
      })

      return result[0];
    } catch (error) {
      this.logHandler.error("MysqlClient: There was an error executing the SQL statement.", {
        eventId: options?.eventId, eventGroupId: options?.eventGroupId,
        highlights: {
          sqlStatement,
          values,
          error,
        }
      });

      throw error;
    }
  }

  /**
   * This method returns the column name for a given class and property name.
   * @param configUniqueKeyname
   * @param sqlStatement
   * @param values
   */
  async querySql(configUniqueKeyname: string, sqlStatement: string, values: any[], options?: {
    eventId?: string,
    eventGroupId?: string
  }): Promise<any> {
    const pool = await this.getPool(configUniqueKeyname);

    this.logHandler.debug("MysqlClient: Executing SQL statement.", {
      eventId: options?.eventId,
      eventGroupId: options?.eventGroupId,
      highlights: {sqlStatement, values}
    });

    try {
      const result = await pool.query(sqlStatement, values);

      this.logHandler.debug("MysqlClient: Successfully executed the SQL statement.", {
        eventId: options?.eventId, eventGroupId: options?.eventGroupId,
        extra: {
          sqlStatement,
          values,
          result
        }
      })

      return result[0];
    } catch (error) {
      this.logHandler.error("MysqlClient: There was an error executing the SQL statement.", {
        highlights: {
          sqlStatement,
          values,
          error,
        }
      });

      throw error;
    }
  }

  /**
   * This method maps the results to a given class type.
   * @param classType
   * @param results
   */
  async mapResults(classType: { new(): any; }, results: any[], options?: {
    eventId?: string,
    eventGroupId?: string,
    excludeFields?: string[],
    logMappingErrors?: boolean
  }) {
    // Transform back the column names from the strategy
    const tableMetadata = this.getTableMetadata(classType);

    if (tableMetadata.autoColumnNamingStrategyReverse) {
      results = results.map((result) => {
        for (const key in result) {
          const newKey = tableMetadata.autoColumnNamingStrategyReverse!(key);

          if (Array.isArray(options?.excludeFields) && options?.excludeFields?.some(fieldToExclude => fieldToExclude === newKey)) {
            delete result[key];
            continue;
          }

          const columnMetadata = this.getColumnMetadata(classType, newKey);

          if (columnMetadata.isJsonBlob) {
            try {
              result[newKey] = JSON.parse(result[key]);
            } catch (e) {
              this.logHandler.warning("MysqlClient: Could not parse the JSON blob. It will be returned as is.", {
                eventId: options?.eventId, eventGroupId: options?.eventGroupId,
                highlights: {
                  error: e,
                  key,
                  newKey,
                  result
                }
              });

              result[newKey] = result[key];
            }

          } else {
            result[newKey] = result[key];
          }

          if (key !== newKey) {
            delete result[key];
          }
        }
        return result;
      });
    }

    return this.dataMapper.autoMap(results, classType, {
      isOptionalDefaultValue: true,
      excludeExtraneousValues: false,
      logErrors: options?.logMappingErrors ?? false
    });
  }

  /**
   * This method returns a single element from the database.
   * @param configUniqueKeyname
   * @param classType
   * @param primaryKey
   */
  async get<T extends { [key: string]: any; }>(configUniqueKeyname: string, classType: {
    new(): T;
  }, primaryKey: string | number, options?: {
    eventId?: string,
    eventGroupId?: string,
    logMappingErrors?: boolean
  }): Promise<T | null> {
    const sql = `SELECT * FROM ${this.getTableMetadata(classType).tableName} WHERE ${this.getPrimaryKeyColumnName(classType)} = ?`;

    const values = await this.executeSql(configUniqueKeyname, sql, [primaryKey]);

    return (await this.mapResults(classType, values, options))[0];
  }

  /**
   * This method creates a new element in the database.
   * @param configUniqueKeyname
   * @param element
   */
  async create<T extends { [key: string]: any; }>(configUniqueKeyname: string, element: T, options?: {
    eventId?: string,
    eventGroupId?: string,
    logMappingErrors?: boolean
  }): Promise<void> {
    const columns = this.getColumnsMetadata(element.constructor as { new(): T; });

    const columnNames = Object.keys(columns).map(column => this.getColumnName(element.constructor as {
      new(): T;
    }, column));
    const columnValues = Object.keys(columns).map(column => {
      const columnMetadata = this.getColumnMetadata(element.constructor as { new(): T; }, column);

      const columnValue = element[column];

      if (columnMetadata.isJsonBlob) {
        return JSON.stringify(columnValue);
      }

      return columnValue;
    });

    // Generate update SQL statement:
    const sql = `INSERT INTO ${this.getTableMetadata(element.constructor as {
      new(): T;
    }).tableName} (${columnNames.join(", ")}) VALUES (${columnValues.map(() => "?").join(", ")})`;

    await this.executeSql(configUniqueKeyname, sql, columnValues, options);
  }

  /**
   * This method updates an element in the database.
   * @param configUniqueKeyname
   * @param element
   */
  async update<T extends { [key: string]: any; }>(configUniqueKeyname: string, element: T, options?: {
    eventId?: string,
    eventGroupId?: string,
    logMappingErrors?: boolean
  }): Promise<void> {
    const columns = this.getColumnsMetadata(element.constructor as { new(): T; });

    const primaryKeyColumnName = this.getPrimaryKeyColumnName(element.constructor as { new(): T; });
    const primaryKeyPropertyName = this.getPrimaryKeyPropertyName(element.constructor as { new(): T; });
    const primaryKeyValue = element[primaryKeyPropertyName];

    const propertyNames = Object.keys(columns).filter(column => column !== primaryKeyPropertyName);

    const columnNames = propertyNames.map(column => this.getColumnName(element.constructor as { new(): T; }, column));
    const columnValues = propertyNames.map(column => {
      const columnMetadata = this.getColumnMetadata(element.constructor as { new(): T; }, column);

      const columnValue = element[column];

      if (columnMetadata.isJsonBlob) {
        return JSON.stringify(columnValue);
      }

      return columnValue;
    });

    // Add it since it will be the last element that will tell us which row to update.
    columnValues.push(primaryKeyValue);

    const sql = `UPDATE ${this.getTableMetadata(element.constructor as { new(): T; }).tableName} SET ${columnNames.join(" = ?, ")} = ? WHERE ${primaryKeyColumnName} = ?`;

    await this.executeSql(configUniqueKeyname, sql, columnValues, options);
  }

  /**
   * This method deletes an element in the database.
   * @param configUniqueKeyname
   * @param classType
   * @param primaryKey
   */
  async delete<T extends { [key: string]: any; }>(configUniqueKeyname: string, classType: {
    new(): T;
  }, primaryKey: string | number, options?: {
    eventId?: string,
    eventGroupId?: string,
    logMappingErrors?: boolean
  }): Promise<void> {
    const sql = `DELETE FROM ${this.getTableMetadata(classType).tableName} WHERE ${this.getPrimaryKeyColumnName(classType)} = ?`;

    await this.executeSql(configUniqueKeyname, sql, [primaryKey], options);
  }

  /**
   * This method searches the database.
   * @param configUniqueKeyname
   * @param classType
   * @param query
   */
  async search<T extends { [key: string]: any; }>(configUniqueKeyname: string, classType: {
    new(): T;
  }, query: SearchQuery, options?: {
    eventId?: string,
    eventGroupId?: string,
    logMappingErrors?: boolean,
    excludeFieldsFromResponse?: string[]
  }): Promise<SearchResult<T>> {
    let sql = "";
    const columns = this.getColumnsMetadata(classType);
    const defaultSearchableFields = Object.keys(columns).filter(column => columns[column].isSearchable).map(column => this.getColumnName(classType, column));
    const tableName = this.getTableMetadata(classType).tableName;
    const sqlValues: any[] = [];

    // Look in the query.fields and look for all the fields that should not be excluded, or that are included explicitly. If there are no fields that match, include `title` and `calculationKeyname` as default fields.
    if (query.query) {
      let fieldsToSearch = query.fields.filter(field => field.includeExplicitly === true).map(field => field.field);

      if (fieldsToSearch.length === 0) {
        fieldsToSearch = defaultSearchableFields;
      }

      // Exclude all the fields that are marked as excluded
      fieldsToSearch = fieldsToSearch.filter(fieldName => {
        const field = query.fields.find(field => field.field === fieldName && field.exclude);

        if (field === undefined) {
          return true;
        }

        // Exclude the excluded field.
        return false;
      });

      // Converts each element in fieldsToSearch from camelCase to snakeCase
      fieldsToSearch = fieldsToSearch.map(field => field.replace(/([A-Z])/g, "_$1").toLowerCase());

      // For each fieldsToSearch, add a LIKE clause to the SQL
      sql += " AND " + fieldsToSearch.map(field => field + " LIKE ?").join(" OR ");

      fieldsToSearch.forEach(field => sqlValues.push("%" + query.query + "%"));
    }

    if (query.filters.length > 0) {
      query.filters.forEach(filter => {
        const column = this.getColumnName(classType, filter.field);

        let operator = null;

        switch (filter.operator as FilteringOperatorEnum) {
          case FilteringOperatorEnum.Equal:
            operator = "=";
            break;
          case FilteringOperatorEnum.NotEqual:
            operator = "!=";
            break;
          case FilteringOperatorEnum.GreaterThan:
            operator = ">";
            break;
          case FilteringOperatorEnum.GreaterThanOrEqual:
            operator = ">=";
            break;
          case FilteringOperatorEnum.LessThan:
            operator = "<";
            break;
          case FilteringOperatorEnum.LessThanOrEqual:
            operator = "<=";
            break;
        }

        if (operator === null) {
          return;
        }

        sql += " AND " + column + " " + operator + " ?";
        sqlValues.push(filter.value);
      });
    }

    //
    // ORDERING
    //
    const orderBy: string[] = []

    query.fields.forEach(field => {
      if (field.order) {
        // Convert the field from camelCase to snakeCase
        const snakeCaseField = field.field.replace(/([A-Z])/g, "_$1").toLowerCase();
        orderBy.push(snakeCaseField + " " + field.order.toUpperCase());
      }
    })

    if (orderBy.length > 0) {
      sql += " ORDER BY " + orderBy.join(", ");
    }

    const totalNumberOfResults = (await this.executeSql(configUniqueKeyname, "SELECT COUNT(*) as total_number_of_results FROM `" + tableName + "` WHERE 1=1 " + sql, sqlValues, options))[0]["total_number_of_results"];

    //
    // PAGING
    //

    // If there's a page, add the limit and offset
    sql += " LIMIT " + query.maximumNumberOfResultsPerPage + " OFFSET " + (query.page - 1) * query.maximumNumberOfResultsPerPage;

    const response = await this.executeSql(configUniqueKeyname, "SELECT * FROM `" + tableName + "` WHERE 1=1 " + sql, sqlValues, options);

    const searchResult = new SearchResult<any>();
    searchResult.page = query.page;
    searchResult.totalNumberOfResults = totalNumberOfResults;
    searchResult.results = await this.mapResults(classType, response, options);
    searchResult.maximumNumberOfResultsPerPage = query.maximumNumberOfResultsPerPage;
    searchResult.numberOfResultsReturned = response.length;

    return searchResult;
  }

  /**
   * This method returns the mysql config corresponding to the unique keyname.
   * @param configUniqueKeyname
   */
  private async getMysqlConfig(configUniqueKeyname: string): Promise<MysqlConfig> {
    const mysqlConfig = this.mysqlConfigProviders.find(mysqlConfigProvider => mysqlConfigProvider.supports(configUniqueKeyname));

    if (!mysqlConfig) {
      throw new Error(`The mysql config with the keyname ${configUniqueKeyname} does not exist.`);
    }

    return await mysqlConfig.getMysqlConfig(configUniqueKeyname) as MysqlConfig;
  }
}
