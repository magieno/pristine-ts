import "reflect-metadata";
import {
  camelCaseColumnStrategy,
  column,
  FilteringOperatorEnum,
  SearchQuery,
  SearchQueryField,
  SortOrderEnum,
  snakeCaseColumnStrategy,
  table
} from "@pristine-ts/database-common";
import {SqliteClient} from "./sqlite.client";
import {
  AutoDataMappingBuilder,
  DataMapper,
  DateNormalizer,
  NumberNormalizer,
  StringNormalizer
} from "@pristine-ts/data-mapping-common";
import {SqliteConfig} from "../configs/sqlite.config";
import {SqliteConfigProviderInterface} from "../interfaces/sqlite-config-provider.interface";
import {LogHandlerInterface} from "@pristine-ts/logging";

describe('SQLite Client', () => {
  @table({
    tableName: "users",
    autoColumnNamingStrategy: snakeCaseColumnStrategy,
    autoColumnNamingStrategyReverse: camelCaseColumnStrategy,
  })
  class User {
    @column({
      isPrimaryKey: true,
    })
    uniqueId: string;

    @column()
    firstName: string;

    @column()
    lastName: string;

    @column({
      isJsonBlob: true,
    })
    extraFields: any;
  }

  const logHandlerMock: LogHandlerInterface = {
    critical(message: string, extra?: any, module?: string): void {
    }, debug(message: string, extra?: any, module?: string): void {
    }, error(message: string, extra?: any, module?: string): void {
    }, info(message: string, extra?: any, module?: string): void {
    }, success(message: string, extra?: any, module?: string): void {
    }, notice(message: string, extra?: any, module?: string): void {
    }, terminate(): void {
    }, warning(message: string, extra?: any, module?: string): void {
    }
  };

  const createSqliteClient = (config: Partial<SqliteConfig> = {}) => {
    const configProvider: SqliteConfigProviderInterface = {
      supports: () => true,
      getSqliteConfig: async () => ({
        uniqueKeyname: "test",
        filename: ":memory:",
        ...config,
      }),
    };

    return new SqliteClient([configProvider], logHandlerMock, new DataMapper(new AutoDataMappingBuilder(), [new DateNormalizer(), new StringNormalizer(), new NumberNormalizer()], []));
  };

  const createUser = (uniqueId: string, firstName: string, lastName: string, extraFields: any = {}): User => {
    const user = new User();
    user.uniqueId = uniqueId;
    user.firstName = firstName;
    user.lastName = lastName;
    user.extraFields = extraFields;
    return user;
  };

  const createUsersTable = async (sqliteClient: SqliteClient) => {
    await sqliteClient.executeSql("test", "CREATE TABLE users (unique_id TEXT PRIMARY KEY, first_name TEXT, last_name TEXT, extra_fields TEXT)", []);
  };

  it("should retrieve the table metadata", () => {
    const sqliteClient = createSqliteClient();
    const tableMetadata = sqliteClient.getTableMetadata(User);

    expect(tableMetadata.tableName).toBe("users");
    expect(tableMetadata.autoColumnNamingStrategy).toBe(snakeCaseColumnStrategy);
  })

  it("should retrieve the columns metadata", () => {
    const sqliteClient = createSqliteClient();
    const columnsMetadata = sqliteClient.getColumnsMetadata(User);

    expect(columnsMetadata.uniqueId.name).toBeUndefined()
    expect(columnsMetadata.uniqueId.isPrimaryKey).toBeTruthy()

    expect(columnsMetadata.firstName).toStrictEqual({"isSearchable": true, "isJsonBlob": false});
    expect(columnsMetadata.lastName).toStrictEqual({"isSearchable": true, "isJsonBlob": false});
    expect(columnsMetadata.extraFields).toStrictEqual({"isSearchable": true, "isJsonBlob": true});
  })

  it("should retrieve the column metadata", () => {
    const sqliteClient = createSqliteClient();
    const columnMetadata = sqliteClient.getColumnMetadata(User, "firstName");

    expect(columnMetadata).toStrictEqual({"isSearchable": true, "isJsonBlob": false});
  })

  it("should retrieve the primary key property and column names", () => {
    const sqliteClient = createSqliteClient();

    expect(sqliteClient.getPrimaryKeyPropertyName(User)).toBe("uniqueId");
    expect(sqliteClient.getPrimaryKeyColumnName(User)).toBe("unique_id");
    expect(sqliteClient.getColumnName(User, "firstName")).toBe("first_name");
  })

  it("should reuse the same database handle for the same unique keyname and reopen it when forced", async () => {
    const sqliteClient = createSqliteClient();

    const database = await sqliteClient.getDatabase("test");
    expect(await sqliteClient.getDatabase("test")).toBe(database);

    const reopenedDatabase = await sqliteClient.getDatabase("test", true);
    expect(reopenedDatabase).not.toBe(database);
  })

  it("should throw when the sqlite config has an empty filename", async () => {
    const sqliteClient = createSqliteClient({filename: ""});

    await expect(sqliteClient.getDatabase("test")).rejects.toThrow("has an empty filename");
  })

  it("should reopen a fresh database after close", async () => {
    const sqliteClient = createSqliteClient();

    const database = await sqliteClient.getDatabase("test");
    await sqliteClient.close("test");

    const reopenedDatabase = await sqliteClient.getDatabase("test");
    expect(reopenedDatabase).not.toBe(database);
  })

  it("should create, get, update and delete an element", async () => {
    const sqliteClient = createSqliteClient();
    await createUsersTable(sqliteClient);

    await sqliteClient.create("test", createUser("user-1", "Etienne", "Noel", {favoriteColor: "blue"}));

    let user = await sqliteClient.get("test", User, "user-1");

    expect(user).not.toBeNull();
    expect(user!.uniqueId).toBe("user-1");
    expect(user!.firstName).toBe("Etienne");
    expect(user!.lastName).toBe("Noel");
    expect(user!.extraFields).toStrictEqual({favoriteColor: "blue"});

    user!.firstName = "Updated";
    await sqliteClient.update("test", user!);

    user = await sqliteClient.get("test", User, "user-1");
    expect(user!.firstName).toBe("Updated");

    await sqliteClient.delete("test", User, "user-1");

    expect(await sqliteClient.get("test", User, "user-1")).toBeNull();
  })

  it("should return the resulting changes when executing a SQL statement", async () => {
    const sqliteClient = createSqliteClient();
    await sqliteClient.executeSql("test", "CREATE TABLE logs (id INTEGER PRIMARY KEY, message TEXT)", []);

    const result = await sqliteClient.executeSql("test", "INSERT INTO logs (message) VALUES (?)", ["hello"]);

    expect(Number(result.changes)).toBe(1);
    expect(Number(result.lastInsertRowid)).toBe(1);
  })

  it("should normalize booleans, dates and undefined values before binding them", async () => {
    const sqliteClient = createSqliteClient();
    await sqliteClient.executeSql("test", "CREATE TABLE flags (id INTEGER PRIMARY KEY, is_active INTEGER, created_at TEXT, note TEXT)", []);

    await sqliteClient.executeSql("test", "INSERT INTO flags (is_active, created_at, note) VALUES (?, ?, ?)", [true, new Date("2026-01-15T12:00:00.000Z"), undefined]);

    const rows = await sqliteClient.querySql("test", "SELECT * FROM flags", []);

    expect(rows[0].is_active).toBe(1);
    expect(rows[0].created_at).toBe("2026-01-15T12:00:00.000Z");
    expect(rows[0].note).toBeNull();
  })

  it("should search with a query, filters, sorting and paging", async () => {
    const sqliteClient = createSqliteClient();
    await createUsersTable(sqliteClient);

    await sqliteClient.create("test", createUser("user-1", "Etienne", "Noel"));
    await sqliteClient.create("test", createUser("user-2", "Jeanne", "Noel"));
    await sqliteClient.create("test", createUser("user-3", "Peter", "Smith"));

    // Search on an explicit field. "nne" matches Etienne and Jeanne, but not Peter.
    const queryResult = await sqliteClient.search("test", User, new SearchQuery({
      query: "nne",
      fields: [new SearchQueryField("firstName", {includeExplicitly: true})],
    }));

    expect(queryResult.totalNumberOfResults).toBe(2);
    expect(queryResult.numberOfResultsReturned).toBe(2);

    // Filter on a field.
    const filterQuery = new SearchQuery();
    filterQuery.addFilter({field: "lastName", operator: FilteringOperatorEnum.Equal, value: "Noel"});
    filterQuery.setSort("firstName", SortOrderEnum.Descending);

    const filterResult = await sqliteClient.search("test", User, filterQuery);

    expect(filterResult.totalNumberOfResults).toBe(2);
    expect(filterResult.results[0].firstName).toBe("Jeanne");
    expect(filterResult.results[1].firstName).toBe("Etienne");

    // Paging.
    const pagedResult = await sqliteClient.search("test", User, new SearchQuery({
      page: 2,
      maximumNumberOfResultsPerPage: 2,
    }));

    expect(pagedResult.totalNumberOfResults).toBe(3);
    expect(pagedResult.numberOfResultsReturned).toBe(1);
    expect(pagedResult.page).toBe(2);
  })
});
