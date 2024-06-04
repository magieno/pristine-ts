import {inject, injectable, singleton} from "tsyringe";
import {MysqlClientInterface} from "../interfaces/mysql-client.interface";
import {ClassMetadata, PropertyMetadata} from "@pristine-ts/metadata";
import {DecoratorMetadataKeynameEnum} from "../enums/decorator-metadata-keyname.enum";
import {TableDecoratorMetadataInterface} from "../interfaces/table-decorator-metadata.interface";
import {ColumnDecoratorMetadataInterface} from "../interfaces/column-decorator-metadata.interface";
import {MysqlModuleKeyname} from "../mysql.module.keyname";
import {createPool, Pool} from "mysql2/promise";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {DataMapper} from "@pristine-ts/data-mapping-common";

@injectable()
@singleton()
export class MysqlClient implements MysqlClientInterface {
    private pools: Map<string, Pool> = new Map<string, Pool>();

    constructor(@inject(`%${MysqlModuleKeyname}.address%`) private readonly address: string,
                @inject(`%${MysqlModuleKeyname}.port%`) private readonly port: number,
                @inject(`%${MysqlModuleKeyname}.user%`) private readonly user: string,
                @inject(`%${MysqlModuleKeyname}.password%`) private readonly password: string,
                @inject(`%${MysqlModuleKeyname}.connection_limit%`) private readonly connectionLimit: number,
                @inject(`%${MysqlModuleKeyname}.debug%`) private readonly debug: boolean,
                @inject('LogHandlerInterface') private readonly logHandler: LogHandlerInterface,
                private readonly dataMapper: DataMapper,
    ) {
    }

    async getPool(databaseName: string, force: boolean = false): Promise<Pool> {
        if (!this.pools.has(databaseName) && !force) {
            try {
                const pool = createPool({
                    connectionLimit: this.connectionLimit,
                    host: this.address,
                    port: this.port,
                    user: this.user,
                    password: this.password,
                    database: databaseName,
                    debug: this.debug,
                });

                this.pools.set(databaseName, pool);

                this.logHandler.debug('MySql Adapter Pool generated successfully', {
                    connectionLimit: this.connectionLimit,
                    host: this.address,
                    user: this.user,
                    password: this.password,
                    database: databaseName,
                    pool,
                });
            } catch (error) {
                this.logHandler.error("Could not create the connection pool", {error})

                throw error;
            }
        }

        return this.pools.get(databaseName) as Pool;
    }

    public getTableMetadata<T extends { [key: string]: any; }>(classType: {
        new(): T;
    }): TableDecoratorMetadataInterface {
        const tableMetadata: TableDecoratorMetadataInterface = ClassMetadata.getMetadata(classType, DecoratorMetadataKeynameEnum.Table);

        if (!tableMetadata) {
            throw new Error(`The class ${classType.name} does not have the @table decorator.`);
        }

        return tableMetadata;
    }

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

    public getColumnMetadata<T extends { [key: string]: any; }>(classType: {
        new(): T;
    }, propertyName: string): ColumnDecoratorMetadataInterface {
        const metadata = PropertyMetadata.getMetadata(classType.prototype, propertyName, DecoratorMetadataKeynameEnum.Column);

        if (!metadata) {
            throw new Error(`The property ${propertyName} does not have the @column decorator.`);
        }

        return metadata;
    }

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

    public getPrimaryKeyColumnName<T extends { [key: string]: any; }>(classType: { new(): T; }) {
        return this.getColumnName(classType, this.getPrimaryKeyPropertyName(classType));
    }

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

    async executeSql(databaseName: string, sqlStatement: string, values: any[]): Promise<any> {
        const pool = await this.getPool(databaseName);

        this.logHandler.debug("Executing SQL Statement", {sqlStatement, values});

        try {
            const result = await pool.query(sqlStatement, values);
            this.logHandler.debug("Successfully executed the SQL Statement", {sqlStatement, values, result})

            return result;
        } catch (error) {
            this.logHandler.error("There was an error executing the SQL Statement", {
                sqlStatement,
                values,
                error,
            });

            throw error;
        }
    }

    async mapResults(classType: { new(): any; }, results: any[]) {
        // Transform back the column names from the strategy
        const tableMetadata = this.getTableMetadata(classType);

        if(tableMetadata.autoColumnNamingStrategyReverse) {
            results = results.map((result) => {
                for(const key in result) {
                    const newKey = tableMetadata.autoColumnNamingStrategyReverse!(key);
                    result[newKey] = result[key];
                    delete result[key];
                }
                return result;
            });
        }

        return results.map((result) => {
            return this.dataMapper.autoMap(result, classType);
        });
    }

    async get<T extends { [key: string]: any; }>(databaseName: string, classType: { new(): T; }, id: string | number): Promise<T | null> {
        const sql = `SELECT * FROM ${this.getTableMetadata(classType).tableName} WHERE ${this.getPrimaryKeyColumnName(classType)} = ?`;

        const values = await this.executeSql(databaseName, sql, [id]);

        return (await this.mapResults(classType, values))[0];
    }

    async create<T extends { [key: string]: any; }>(databaseName: string, element: T): Promise<void> {
        const columns = this.getColumnsMetadata(element.constructor as { new(): T; });

        const columnNames = Object.keys(columns).map(column => this.getColumnName(element.constructor as { new(): T; }, column));
        const columnValues = Object.keys(columns).map(column => element[column]);

        // Generate update SQL statement:
        const sql = `UPDATE ${this.getTableMetadata(element.constructor as { new(): T; }).tableName} SET (${columnNames.join(", ")}) WHERE `;

        await this.executeSql(databaseName, sql, columnValues);
    }

    async update<T extends { [key: string]: any; }>(databaseName: string, element: T): Promise<T | null> {
        const columns = this.getColumnsMetadata(element.constructor as { new(): T; });

        const primaryKeyColumnName = this.getPrimaryKeyColumnName(element.constructor as { new(): T; });
        const primaryKeyPropertyName = this.getPrimaryKeyPropertyName(element.constructor as { new(): T; });
        const primaryKeyValue = element[primaryKeyPropertyName];

        const propertyNames = Object.keys(columns).filter(column => column !== primaryKeyPropertyName);

        const columnNames = propertyNames.map(column => this.getColumnName(element.constructor as { new(): T; }, column));
        const columnValues = propertyNames.map(column => element[column]);

        // Add it since it will be the last element that will tell us which row to update.
        columnValues.push(primaryKeyValue);

        const sql = `UPDATE ${this.getTableMetadata(element.constructor as { new(): T; }).tableName} SET ${columnNames.join(" = ?, ")} = ? WHERE ${primaryKeyColumnName} = ?`;

        return this.executeSql(databaseName, sql, columnValues);
    }

    /*async delete<T extends { [key: string]: any; }>(databaseName: string, element: T): Promise<T | null> {
        const columns = this.getColumnsMetadata(element.constructor);

        const columnNames = Object.keys(columns).map(column => this.getColumnName(element.constructor, column));
        const columnValues = Object.keys(columns).map(column => element[column]);

        const sql = `INSERT INTO ${this.getTableMetadata(element.constructor).tableName} (${columnNames.join(", ")})
                     VALUES (${columnValues.map(() => "?").join(", ")})`;

        return this.executeSql(databaseName, sql, columnValues);
    }*/

    /*async search<T extends { [key: string]: any; }>(databaseName: string, element: T): Promise<T | null> {
        const columns = this.getColumnsMetadata(element.constructor);

        const columnNames = Object.keys(columns).map(column => this.getColumnName(element.constructor, column));
        const columnValues = Object.keys(columns).map(column => element[column]);

        const sql = `INSERT INTO ${this.getTableMetadata(element.constructor).tableName} (${columnNames.join(", ")})
                     VALUES (${columnValues.map(() => "?").join(", ")})`;

        return this.executeSql(databaseName, sql, columnValues);
    }*/
}
