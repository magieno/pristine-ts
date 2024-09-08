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
import {SearchQuery} from "@pristine-ts/mysql-common";

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

        @column({
            isJsonBlob: true,
        })
        extraFields: any;
    }

    it("should retrieve the table metadata", () => {
        const mysqlClient = new MysqlClient([],{
            critical(message: string, extra?: any, module?: string): void {
            }, debug(message: string, extra?: any, module?: string): void {
            }, error(message: string, extra?: any, module?: string): void {
            }, info(message: string, extra?: any, module?: string): void {
            }, terminate(): void {
            }, warning(message: string, extra?: any, module?: string): void {
            }
        }, new DataMapper(new AutoDataMappingBuilder(), [new DateNormalizer(), new StringNormalizer(), new NumberNormalizer()], []));
        const tableMetadata = mysqlClient.getTableMetadata(User);

        expect(tableMetadata.tableName).toBe("users");
        expect(tableMetadata.autoColumnNamingStrategy).toBe(snakeCaseColumnStrategy);
    })

    it("should retrieve the columns metadata", () => {
        const mysqlClient = new MysqlClient([],{
            critical(message: string, extra?: any, module?: string): void {
            }, debug(message: string, extra?: any, module?: string): void {
            }, error(message: string, extra?: any, module?: string): void {
            }, info(message: string, extra?: any, module?: string): void {
            }, terminate(): void {
            }, warning(message: string, extra?: any, module?: string): void {
            }
        }, new DataMapper(new AutoDataMappingBuilder(), [new DateNormalizer(), new StringNormalizer(), new NumberNormalizer()], []));
        const columnsMetadata = mysqlClient.getColumnsMetadata(User);

        expect(columnsMetadata.uniqueId.name).toBeUndefined()
        expect(columnsMetadata.uniqueId.isPrimaryKey).toBeTruthy()

        expect(columnsMetadata.firstName).toStrictEqual({"isSearchable": true, "isJsonBlob": false});
        expect(columnsMetadata.lastName).toStrictEqual({"isSearchable": true, "isJsonBlob": false});
        expect(columnsMetadata.extraFields).toStrictEqual({"isSearchable": true, "isJsonBlob": true});
    })

    it("should retrieve the column metadata", () => {
        const mysqlClient = new MysqlClient([],{
            critical(message: string, extra?: any, module?: string): void {
            }, debug(message: string, extra?: any, module?: string): void {
            }, error(message: string, extra?: any, module?: string): void {
            }, info(message: string, extra?: any, module?: string): void {
            }, terminate(): void {
            }, warning(message: string, extra?: any, module?: string): void {
            }
        }, new DataMapper(new AutoDataMappingBuilder(), [new DateNormalizer(), new StringNormalizer(), new NumberNormalizer()], []));
        const uniqueIdColumnMetadata = mysqlClient.getColumnMetadata(User, "uniqueId");

        expect(uniqueIdColumnMetadata.name).toBeUndefined()
        expect(uniqueIdColumnMetadata.isPrimaryKey).toBeTruthy()

        expect(mysqlClient.getColumnMetadata(User, "firstName")).toStrictEqual({"isSearchable": true, "isJsonBlob": true});
        expect(mysqlClient.getColumnMetadata(User, "lastName")).toStrictEqual({"isSearchable": true, "isJsonBlob": true});
    })

    it("should retrieve the primary key column name", () => {
        const mysqlClient = new MysqlClient([],{
            critical(message: string, extra?: any, module?: string): void {
            }, debug(message: string, extra?: any, module?: string): void {
            }, error(message: string, extra?: any, module?: string): void {
            }, info(message: string, extra?: any, module?: string): void {
            }, terminate(): void {
            }, warning(message: string, extra?: any, module?: string): void {
            }
        }, new DataMapper(new AutoDataMappingBuilder(), [new DateNormalizer(), new StringNormalizer(), new NumberNormalizer()], []));
        const primaryKeyColumnName = mysqlClient.getPrimaryKeyColumnName(User);

        expect(primaryKeyColumnName).toBe("unique_id");
    })

    it("should retrieve the column names", () => {
        const mysqlClient = new MysqlClient([],{
            critical(message: string, extra?: any, module?: string): void {
            }, debug(message: string, extra?: any, module?: string): void {
            }, error(message: string, extra?: any, module?: string): void {
            }, info(message: string, extra?: any, module?: string): void {
            }, terminate(): void {
            }, warning(message: string, extra?: any, module?: string): void {
            }
        }, new DataMapper(new AutoDataMappingBuilder(), [new DateNormalizer(), new StringNormalizer(), new NumberNormalizer()], []));
        const primaryKeyColumnName = mysqlClient.getColumnName(User, "uniqueId");

        expect(mysqlClient.getColumnName(User, "uniqueId")).toBe("unique_id");
        expect(mysqlClient.getColumnName(User, "firstName")).toBe("first_name");
        expect(mysqlClient.getColumnName(User, "lastName")).toBe("last_name");
    })

    it("should properly retrieve an object in the db based on the id", async () => {
        const mysqlClient = new MysqlClient([],{
            critical(message: string, extra?: any, module?: string): void {
            }, debug(message: string, extra?: any, module?: string): void {
            }, error(message: string, extra?: any, module?: string): void {
            }, info(message: string, extra?: any, module?: string): void {
            }, terminate(): void {
            }, warning(message: string, extra?: any, module?: string): void {
            }
        }, new DataMapper(new AutoDataMappingBuilder(), [new DateNormalizer(), new StringNormalizer(), new NumberNormalizer()], []));

        // Mock the executeSql method with a spy and verify that the first argument was the expected SQL Statement.
        const executeSqlSpy = jest.spyOn(mysqlClient, "executeSql").mockResolvedValueOnce([
            {
                "unique_id": "1",
                "first_name": "John",
                "last_name": "Smith",
            }
        ]);
        const user = await mysqlClient.get("pristine", User, "1");

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
        const mysqlClient = new MysqlClient([],{
            critical(message: string, extra?: any, module?: string): void {
            }, debug(message: string, extra?: any, module?: string): void {
            }, error(message: string, extra?: any, module?: string): void {
            }, info(message: string, extra?: any, module?: string): void {
            }, terminate(): void {
            }, warning(message: string, extra?: any, module?: string): void {
            }
        }, new DataMapper(new AutoDataMappingBuilder(), [new DateNormalizer(), new StringNormalizer(), new NumberNormalizer()], []));

        // Mock the executeSql method with a spy and verify that the first argument was the expected SQL Statement.
        const executeSqlSpy = jest.spyOn(mysqlClient, "executeSql").mockResolvedValueOnce([]);
        const user = new User();
        user.uniqueId = "1";
        user.firstName = "John";
        user.lastName = "Smith";

        await mysqlClient.create("pristine", user);

        expect(executeSqlSpy).toHaveBeenCalledWith(
            "pristine",
            "INSERT INTO users (unique_id, first_name, last_name, extra_fields) VALUES (?, ?, ?, ?)",
            ["1", "John", "Smith"],
        );
    })

    it("should properly update an object in the db", async () => {
        const mysqlClient = new MysqlClient([],{
            critical(message: string, extra?: any, module?: string): void {
            }, debug(message: string, extra?: any, module?: string): void {
            }, error(message: string, extra?: any, module?: string): void {
            }, info(message: string, extra?: any, module?: string): void {
            }, terminate(): void {
            }, warning(message: string, extra?: any, module?: string): void {
            }
        }, new DataMapper(new AutoDataMappingBuilder(), [new DateNormalizer(), new StringNormalizer(), new NumberNormalizer()], []));

        // Mock the executeSql method with a spy and verify that the first argument was the expected SQL Statement.
        const executeSqlSpy = jest.spyOn(mysqlClient, "executeSql").mockResolvedValueOnce([]);
        const user = new User();
        user.uniqueId = "1";
        user.firstName = "John";
        user.lastName = "Smith";

        await mysqlClient.update("pristine", user);

        expect(executeSqlSpy).toHaveBeenCalledWith(
            "pristine",
            "UPDATE users SET first_name = ?, last_name = ?, extra_fields = ? WHERE unique_id = ?",
            ["John", "Smith", undefined, "1"],
        );
    })

    it("should properly delete an object in the db", async () => {
        const mysqlClient = new MysqlClient([],{
            critical(message: string, extra?: any, module?: string): void {
            }, debug(message: string, extra?: any, module?: string): void {
            }, error(message: string, extra?: any, module?: string): void {
            }, info(message: string, extra?: any, module?: string): void {
            }, terminate(): void {
            }, warning(message: string, extra?: any, module?: string): void {
            }
        }, new DataMapper(new AutoDataMappingBuilder(), [new DateNormalizer(), new StringNormalizer(), new NumberNormalizer()], []));

        const executeSqlSpy = jest.spyOn(mysqlClient, "executeSql").mockResolvedValueOnce([]);

        await mysqlClient.delete("pristine", User, "1");

        expect(executeSqlSpy).toHaveBeenCalledWith(
            "pristine",
            "DELETE FROM users WHERE unique_id = ?",
            ["1"],
        );
    })

    it("should properly search an object in the db", async () => {
        const mysqlClient = new MysqlClient([],{
            critical(message: string, extra?: any, module?: string): void {
            }, debug(message: string, extra?: any, module?: string): void {
            }, error(message: string, extra?: any, module?: string): void {
            }, info(message: string, extra?: any, module?: string): void {
            }, terminate(): void {
            }, warning(message: string, extra?: any, module?: string): void {
            }
        }, new DataMapper(new AutoDataMappingBuilder(), [new DateNormalizer(), new StringNormalizer(), new NumberNormalizer()], []));

        const executeSqlSpy = jest.spyOn(mysqlClient, "executeSql").mockImplementation(async (databaseName: string, sqlStatement: string, values: any[]) => {
            if (sqlStatement.startsWith("SELECT COUNT(*)")) {
                return [
                    {
                        "total_number_of_results": 3,
                    }
                ];
            }

            if(sqlStatement.startsWith("SELECT * FROM `users` WHERE 1=1 ")) {
                return [
                    {"unique_id": "1", "first_name": "John", "last_name": "Smith"},
                    {"unique_id": "2", "first_name": "Rick", "last_name": "Sanchez"},
                    {"unique_id": "3", "first_name": "Peter", "last_name": "Ricardo"},
                ];
            }
        });

        const query = new SearchQuery();

        const searchResults = await mysqlClient.search("pristine", User, query);
        expect(searchResults.numberOfResultsReturned).toBe(3);
        expect(searchResults.totalNumberOfResults).toBe(3);
        expect(searchResults.results.length).toBe(3);
        expect(searchResults.results[0]).toBeInstanceOf(User);
        expect(searchResults.results[0].uniqueId).toBe("1");
        expect(searchResults.results[0].firstName).toBe("John");
        expect(searchResults.results[0].lastName).toBe("Smith");
        expect(searchResults.results[1]).toBeInstanceOf(User);
        expect(searchResults.results[1].uniqueId).toBe("2");
        expect(searchResults.results[1].firstName).toBe("Rick");
        expect(searchResults.results[1].lastName).toBe("Sanchez");
        expect(searchResults.results[2]).toBeInstanceOf(User);
        expect(searchResults.results[2].uniqueId).toBe("3");
        expect(searchResults.results[2].firstName).toBe("Peter");
        expect(searchResults.results[2].lastName).toBe("Ricardo");
    })

    it("should properly map the results", async () => {
        const mysqlClient = new MysqlClient([],{
            critical(message: string, extra?: any, module?: string): void {
            }, debug(message: string, extra?: any, module?: string): void {
            }, error(message: string, extra?: any, module?: string): void {
            }, info(message: string, extra?: any, module?: string): void {
            }, terminate(): void {
            }, warning(message: string, extra?: any, module?: string): void {
            }
        }, new DataMapper(new AutoDataMappingBuilder(), [new DateNormalizer(), new StringNormalizer(), new NumberNormalizer()], []));

        const users = await mysqlClient.mapResults(User, [
            {"unique_id": "1", "first_name": "John", "last_name": "Smith", "extra_fields": '{"a": 1}'},
            {"unique_id": "2", "first_name": "Rick", "last_name": "Sanchez", "extra_fields": '{"a": 1}'},
            {"unique_id": "3", "first_name": "Peter", "last_name": "Ricardo", "extra_fields": '{"a": 1}'},
        ]);

        expect(users).toBeDefined();
        expect(Array.isArray(users)).toBeTruthy()
        expect(users[0] instanceof User).toBeTruthy()
        expect(users[0].uniqueId).toBe("1")
        expect(users[0].extraFields.a).toBe(1)
    })

    it("should properly map the results and exclude the fields", async () => {
        const mysqlClient = new MysqlClient([],{
            critical(message: string, extra?: any, module?: string): void {
            }, debug(message: string, extra?: any, module?: string): void {
            }, error(message: string, extra?: any, module?: string): void {
            }, info(message: string, extra?: any, module?: string): void {
            }, terminate(): void {
            }, warning(message: string, extra?: any, module?: string): void {
            }
        }, new DataMapper(new AutoDataMappingBuilder(), [new DateNormalizer(), new StringNormalizer(), new NumberNormalizer()], []));

        const users = await mysqlClient.mapResults(User, [
            {"unique_id": "1", "first_name": "John", "last_name": "Smith", "extra_fields": {"a": 1}},
            {"unique_id": "2", "first_name": "Rick", "last_name": "Sanchez", "extra_fields": {"a": 1}},
            {"unique_id": "3", "first_name": "Peter", "last_name": "Ricardo", "extra_fields": {"a": 1}},
        ], ["extraFields"]);

        expect(users).toBeDefined();
        expect(Array.isArray(users)).toBeTruthy()
        expect(users[0] instanceof User).toBeTruthy()
        expect(users[0].uniqueId).toBe("1")
        expect(users[0].extraFields).toBeUndefined()
        expect(users[0].extra_fields).toBeUndefined()
    })
});
