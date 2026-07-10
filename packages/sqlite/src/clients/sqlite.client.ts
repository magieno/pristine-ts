import {inject, injectable, injectAll, singleton} from "tsyringe";
import {DatabaseSync, StatementResultingChanges} from "node:sqlite";
import {SqliteClientInterface} from "../interfaces/sqlite-client.interface";
import {ClassMetadata, PropertyMetadata} from "@pristine-ts/metadata";
import {
  ColumnDecoratorMetadataInterface,
  DecoratorMetadataKeynameEnum,
  FilteringOperatorEnum,
  SearchQuery,
  SearchResult,
  TableDecoratorMetadataInterface
} from "@pristine-ts/database-common";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {DataMapper} from "@pristine-ts/data-mapping-common";
import {tag, traced} from "@pristine-ts/common";
import {SqliteConfig} from "../configs/sqlite.config";
import {SqliteConfigProviderInterface} from "../interfaces/sqlite-config-provider.interface";
import {SqliteJournalModeEnum} from "../enums/sqlite-journal-mode.enum";

@tag("SqliteClientInterface")
@injectable()
@singleton()
export class SqliteClient implements SqliteClientInterface {
  private databases: Map<string, DatabaseSync> = new Map<string, DatabaseSync>();

  constructor(
    @injectAll("SqliteConfigProviderInterface") private readonly sqliteConfigProviders: SqliteConfigProviderInterface[],
    @inject('LogHandlerInterface') private readonly logHandler: LogHandlerInterface,
    private readonly dataMapper: DataMapper,
  ) {
  }

  /**
   * This method returns the database handle corresponding to the config unique keyname, opening it if needed.
   * @param configUniqueKeyname
   * @param force
   */
  @traced()
  async getDatabase(configUniqueKeyname: string, force: boolean = false, options?: {
    eventId?: string,
    eventGroupId?: string
  }): Promise<DatabaseSync> {
    if (!this.databases.has(configUniqueKeyname) || force) {
      try {
        const sqliteConfig = await this.getSqliteConfig(configUniqueKeyname);

        // An empty filename would silently open a temporary on-disk database that is deleted on
        // close (SQLite semantics), which almost certainly hides a missing configuration.
        if (sqliteConfig.filename === "") {
          throw new Error(`The sqlite config with the unique keyname ${configUniqueKeyname} has an empty filename. Register a SqliteConfig with a file path or ":memory:".`);
        }

        const previousDatabase = this.databases.get(configUniqueKeyname);
        if (previousDatabase !== undefined) {
          previousDatabase.close();
          this.databases.delete(configUniqueKeyname);
        }

        const database = new DatabaseSync(sqliteConfig.filename, {
          readOnly: sqliteConfig.readOnly ?? false,
          enableForeignKeyConstraints: sqliteConfig.enableForeignKeyConstraints ?? true,
          timeout: sqliteConfig.busyTimeoutMs ?? 5000,
        });

        // `:memory:` databases have no on-disk journal and read-only connections cannot change
        // the journal mode, so the pragma only applies to writable, file-backed databases.
        if (sqliteConfig.filename !== ":memory:" && sqliteConfig.readOnly !== true) {
          database.exec(`PRAGMA journal_mode = ${sqliteConfig.journalMode ?? SqliteJournalModeEnum.Wal};`);
        }

        this.databases.set(configUniqueKeyname, database);

        this.logHandler.debug('SqliteClient: SQLite database opened successfully.', {
          eventId: options?.eventId,
          eventGroupId: options?.eventGroupId,
          extra: {
            sqliteConfig,
          }
        });
      } catch (error) {
        this.logHandler.error("SqliteClient: Could not open the SQLite database.", {
          eventId: options?.eventId,
          eventGroupId: options?.eventGroupId, highlights: {error}
        })

        throw error;
      }
    }

    return this.databases.get(configUniqueKeyname) as DatabaseSync;
  }

  /**
   * This method closes the database handle corresponding to the config unique keyname, if it is open.
   * @param configUniqueKeyname
   */
  async close(configUniqueKeyname: string): Promise<void> {
    const database = this.databases.get(configUniqueKeyname);

    if (database === undefined) {
      return;
    }

    database.close();
    this.databases.delete(configUniqueKeyname);
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
   * This method executes a SQL statement that doesn't return rows (INSERT, UPDATE, DELETE, DDL) and
   * returns the resulting changes.
   * @param configUniqueKeyname
   * @param sqlStatement
   * @param values
   */
  @traced()
  async executeSql(configUniqueKeyname: string, sqlStatement: string, values: any[], options?: {
    eventId?: string,
    eventGroupId?: string
  }): Promise<StatementResultingChanges> {
    const database = await this.getDatabase(configUniqueKeyname);

    this.logHandler.debug("SqliteClient: Executing SQL statement.", {
      eventId: options?.eventId,
      eventGroupId: options?.eventGroupId,
      highlights: {sqlStatement, values}
    });

    try {
      const statement = database.prepare(sqlStatement);
      const result = statement.run(...this.normalizeValues(values));

      this.logHandler.debug("SqliteClient: Successfully executed the SQL statement.", {
        eventId: options?.eventId, eventGroupId: options?.eventGroupId,
        highlights: {
          sqlStatement,
          values,
          result
        }
      })

      return result;
    } catch (error) {
      this.logHandler.error("SqliteClient: There was an error executing the SQL statement.", {
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
   * This method executes a SQL statement and returns the rows it produces.
   * @param configUniqueKeyname
   * @param sqlStatement
   * @param values
   */
  @traced()
  async querySql(configUniqueKeyname: string, sqlStatement: string, values: any[], options?: {
    eventId?: string,
    eventGroupId?: string
  }): Promise<any> {
    const database = await this.getDatabase(configUniqueKeyname);

    this.logHandler.debug("SqliteClient: Executing SQL statement.", {
      eventId: options?.eventId,
      eventGroupId: options?.eventGroupId,
      highlights: {sqlStatement, values}
    });

    try {
      const statement = database.prepare(sqlStatement);
      // node:sqlite returns rows as null-prototype objects, which breaks `constructor`-based
      // metadata lookups and the data mapper; copy them into plain objects.
      const result: any = statement.all(...this.normalizeValues(values)).map((row) => ({...row}));

      this.logHandler.debug("SqliteClient: Successfully executed the SQL statement.", {
        eventId: options?.eventId, eventGroupId: options?.eventGroupId,
        extra: {
          sqlStatement,
          values,
          result
        }
      })

      return result;
    } catch (error) {
      this.logHandler.error("SqliteClient: There was an error executing the SQL statement.", {
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
  @traced()
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
              this.logHandler.warning("SqliteClient: Could not parse the JSON blob. It will be returned as is.", {
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
  @traced()
  async get<T extends { [key: string]: any; }>(configUniqueKeyname: string, classType: {
    new(): T;
  }, primaryKey: string | number, options?: {
    eventId?: string,
    eventGroupId?: string,
    logMappingErrors?: boolean
  }): Promise<T | null> {
    const sql = `SELECT * FROM ${this.getTableMetadata(classType).tableName} WHERE ${this.getPrimaryKeyColumnName(classType)} = ?`;

    const values = await this.querySql(configUniqueKeyname, sql, [primaryKey], options);

    return (await this.mapResults(classType, values, options))[0] ?? null;
  }

  /**
   * This method creates a new element in the database.
   * @param configUniqueKeyname
   * @param element
   */
  @traced()
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
  @traced()
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
  @traced()
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
  @traced()
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

    const totalNumberOfResults = (await this.querySql(configUniqueKeyname, "SELECT COUNT(*) as total_number_of_results FROM `" + tableName + "` WHERE 1=1 " + sql, sqlValues, options))[0]["total_number_of_results"];

    //
    // PAGING
    //

    // If there's a page, add the limit and offset
    sql += " LIMIT " + query.maximumNumberOfResultsPerPage + " OFFSET " + (query.page - 1) * query.maximumNumberOfResultsPerPage;

    const response = await this.querySql(configUniqueKeyname, "SELECT * FROM `" + tableName + "` WHERE 1=1 " + sql, sqlValues, options);

    const searchResult = new SearchResult<any>();
    searchResult.page = query.page;
    searchResult.totalNumberOfResults = totalNumberOfResults;
    searchResult.results = await this.mapResults(classType, response, options);
    searchResult.maximumNumberOfResultsPerPage = query.maximumNumberOfResultsPerPage;
    searchResult.numberOfResultsReturned = response.length;

    return searchResult;
  }

  /**
   * This method returns the sqlite config corresponding to the unique keyname.
   * @param configUniqueKeyname
   */
  private async getSqliteConfig(configUniqueKeyname: string): Promise<SqliteConfig> {
    const sqliteConfig = this.sqliteConfigProviders.find(sqliteConfigProvider => sqliteConfigProvider.supports(configUniqueKeyname));

    if (!sqliteConfig) {
      throw new Error(`The sqlite config with the keyname ${configUniqueKeyname} does not exist.`);
    }

    return await sqliteConfig.getSqliteConfig(configUniqueKeyname) as SqliteConfig;
  }

  /**
   * node:sqlite only binds null, number, bigint, string and binary values. mysql2 accepts
   * booleans and Dates directly, so to keep entity classes portable across both clients the
   * values are normalized here before binding.
   */
  private normalizeValues(values: any[]): any[] {
    return values.map((value) => {
      if (value === undefined || value === null) {
        return null;
      }

      if (typeof value === "boolean") {
        return value ? 1 : 0;
      }

      if (value instanceof Date) {
        return value.toISOString();
      }

      return value;
    });
  }
}
