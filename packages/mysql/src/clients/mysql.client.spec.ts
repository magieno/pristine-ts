import {column} from "../decorators/column.decorator";
import {table} from "../decorators/table.decorator";
import {snakeCaseColumnStrategy} from "../strategies/snake-case-column.strategy";
import {MysqlClient} from "./mysql.client";

describe('MySQL Client', () => {
    @table({
        tableName: "users",
        autoColumnNamingStrategy: snakeCaseColumnStrategy,
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
    });

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
        const primaryKeyColumnName = mysqlClient.getPrivateKeyColumnName(User);

        expect(primaryKeyColumnName).toBe("unique_id");
    })

    it("should retrieve the column names", () => {
        const primaryKeyColumnName = mysqlClient.getColumnName(User, "uniqueId");

        expect(mysqlClient.getColumnName(User, "uniqueId")).toBe("unique_id");
        expect(mysqlClient.getColumnName(User, "firstName")).toBe("first_name");
        expect(mysqlClient.getColumnName(User, "lastName")).toBe("last_name");
    })

    it("should properly craft a SQL statement and map the object back", () => {
        // Mock the executeSql method with a spy and verify that the first argument was the expected SQL Statement.
        const executeSqlSpy = jest.spyOn(mysqlClient, "executeSql").mockResolvedValueOnce({});
    })
});