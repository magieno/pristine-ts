import {column} from "../decorators/column.decorator";
import {table} from "../decorators/table.decorator";
import {snakeCaseColumnStrategy} from "../strategies/snake-case-column.strategy";
import {MysqlClient} from "./mysql.client";
import {
    AutoDataMappingBuilder,
    DataMapper,
    DateNormalizer,
    NumberNormalizer,
    StringNormalizer
} from "@pristine-ts/data-mapping-common";
import {camelCaseColumnStrategy} from "../strategies/camel-case-column.strategy";

describe('MySQL Client', () => {
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
    }

    const mysqlClient = new MysqlClient("", 0, "", "", 0, false, {
        critical(message: string, extra?: any, module?: string): void {
        }, debug(message: string, extra?: any, module?: string): void {
        }, error(message: string, extra?: any, module?: string): void {
        }, info(message: string, extra?: any, module?: string): void {
        }, terminate(): void {
        }, warning(message: string, extra?: any, module?: string): void {
        }
    }, new DataMapper(new AutoDataMappingBuilder(), [new DateNormalizer(), new StringNormalizer(), new NumberNormalizer()], []));

    it("should retrieve the table metadata", () => {
        const tableMetadata = mysqlClient.getTableMetadata(User);

        expect(tableMetadata.tableName).toBe("users");
        expect(tableMetadata.autoColumnNamingStrategy).toBe(snakeCaseColumnStrategy);
    })

    it("should retrieve the columns metadata", () => {
        const columnsMetadata = mysqlClient.getColumnsMetadata(User);

        expect(columnsMetadata.uniqueId.name).toBeUndefined()
        expect(columnsMetadata.uniqueId.isPrimaryKey).toBeTruthy()

        expect(columnsMetadata.firstName).toEqual({});
        expect(columnsMetadata.lastName).toEqual({});
    })

    it("should retrieve the column metadata", () => {
        const uniqueIdColumnMetadata = mysqlClient.getColumnMetadata(User, "uniqueId");

        expect(uniqueIdColumnMetadata.name).toBeUndefined()
        expect(uniqueIdColumnMetadata.isPrimaryKey).toBeTruthy()

        expect(mysqlClient.getColumnMetadata(User, "firstName")).toEqual({});
        expect(mysqlClient.getColumnMetadata(User, "lastName")).toEqual({});
    })

    it("should retrieve the primary key column name", () => {
        const primaryKeyColumnName = mysqlClient.getPrimaryKeyColumnName(User);

        expect(primaryKeyColumnName).toBe("unique_id");
    })

    it("should retrieve the column names", () => {
        const primaryKeyColumnName = mysqlClient.getColumnName(User, "uniqueId");

        expect(mysqlClient.getColumnName(User, "uniqueId")).toBe("unique_id");
        expect(mysqlClient.getColumnName(User, "firstName")).toBe("first_name");
        expect(mysqlClient.getColumnName(User, "lastName")).toBe("last_name");
    })

    it("should properly retrieve an object in the db based on the id", async () => {
        // Mock the executeSql method with a spy and verify that the first argument was the expected SQL Statement.
        const executeSqlSpy = jest.spyOn(mysqlClient, "executeSql").mockResolvedValueOnce([
            {
            "unique_id": "1",
            "first_name": "John",
            "last_name": "Smith",
            }
            ]);
        const user = await mysqlClient.get("pristine", User, "1" );

        expect(executeSqlSpy).toHaveBeenCalledWith(
            "pristine",
            "SELECT * FROM users WHERE unique_id = ?",
            ["1"],
        );

        expect(user).toBeDefined();
        expect(user).toBeInstanceOf(User);
        expect(user!.uniqueId).toBe("1");
        expect(user!.firstName).toBe("John");
        expect(user!.lastName).toBe("Smith");
    })

    it("should properly create an object in the db", async () => {
        // Mock the executeSql method with a spy and verify that the first argument was the expected SQL Statement.
        const executeSqlSpy = jest.spyOn(mysqlClient, "executeSql").mockResolvedValueOnce([]);
        const user = new User();
        user.uniqueId = "1";
        user.firstName = "John";
        user.lastName = "Smith";

        await mysqlClient.create("pristine", user);

        expect(executeSqlSpy).toHaveBeenCalledWith(
            "pristine",
            "INSERT INTO users (unique_id, first_name, last_name) VALUES (?, ?, ?)",
            ["1", "John", "Smith"],
        );
    })

    it("should properly update an object in the db", async () => {
        // Mock the executeSql method with a spy and verify that the first argument was the expected SQL Statement.
        const executeSqlSpy = jest.spyOn(mysqlClient, "executeSql").mockResolvedValueOnce([]);
        const user = new User();
        user.uniqueId = "1";
        user.firstName = "John";
        user.lastName = "Smith";

        await mysqlClient.update("pristine", user);

        expect(executeSqlSpy).toHaveBeenCalledWith(
            "pristine",
            "UPDATE users SET first_name = ?, last_name = ? WHERE unique_id = ?",
            ["John", "Smith", "1"],
        );
    })
});
