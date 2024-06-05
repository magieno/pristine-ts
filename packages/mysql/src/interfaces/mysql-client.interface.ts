import {createPool, Pool} from "mysql2/promise";
import {TableDecoratorMetadataInterface} from "./table-decorator-metadata.interface";
import {ColumnDecoratorMetadataInterface} from "./column-decorator-metadata.interface";
import {SearchQuery, SearchResult} from "@pristine-ts/mysql-common";

export interface MysqlClientInterface {
    /**
     * This method returns a pool of connections to the database.
     * @param configUniqueKeyname
     * @param force
     */
    getPool(configUniqueKeyname: string, force: boolean): Promise<Pool>;

    /**
     * This method returns the table metadata for a given class.
     * @param classType
     */
    getTableMetadata<T extends { [key: string]: any; }>(classType: { new(): T; }): TableDecoratorMetadataInterface

    /**
     * This method returns the columns metadata for a given class.
     * @param classType
     */
    getColumnsMetadata<T extends { [key: string]: any; }>(classType: { new(): T; }): { [property in string]: ColumnDecoratorMetadataInterface };

    /**
     * This method returns the column metadata for a given class and property name.
     * @param classType
     * @param propertyName
     */
    getColumnMetadata<T extends { [key: string]: any; }>(classType: { new(): T;}, propertyName: string): ColumnDecoratorMetadataInterface

    /**
     * This method returns the primary key property name for a given class.
     * @param classType
     */
    getPrimaryKeyPropertyName<T extends { [key: string]: any; }>(classType: { new(): T; }): string;

    /**
     * This method returns the primary key column name for a given class.
     * @param classType
     */
    getPrimaryKeyColumnName<T extends { [key: string]: any; }>(classType: { new(): T; }): string;

    /**
     * This method returns the column name for a given class and property name.
     *
     * @param classType
     * @param propertyName
     */
    getColumnName<T extends { [key: string]: any; }>(classType: { new(): T; }, propertyName: string): string

    /**
     * This method returns the column name for a given class and property name.
     * @param configUniqueKeyname
     * @param sqlStatement
     * @param values
     */
    executeSql(configUniqueKeyname: string, sqlStatement: string, values: any[]): Promise<any>

    /**
     * This method maps the results to a given class type.
     * @param classType
     * @param results
     */
    mapResults(classType: { new(): any; }, results: any[]): Promise<any>;

    /**
     * This method returns a single element from the database.
     * @param configUniqueKeyname
     * @param classType
     * @param primaryKey
     */
    get<T extends { [key: string]: any; }>(configUniqueKeyname: string, classType: { new(): T; }, primaryKey: string | number): Promise<T | null>

    /**
     * This method creates a new element in the database.
     * @param configUniqueKeyname
     * @param element
     */
    create<T extends { [key: string]: any; }>(configUniqueKeyname: string, element: T): Promise<void>

    /**
     * This method updates an element in the database.
     * @param configUniqueKeyname
     * @param element
     */
    update<T extends { [key: string]: any; }>(configUniqueKeyname: string, element: T): Promise<void>

    /**
     * This method deletes an element in the database.
     * @param configUniqueKeyname
     * @param classType
     * @param primaryKey
     */
    delete<T extends { [key: string]: any; }>(configUniqueKeyname: string, classType: { new(): T; }, primaryKey: string | number): Promise<void>

    /**
     * This method searches the database.
     * @param configUniqueKeyname
     * @param classType
     * @param query
     */
    search<T extends { [key: string]: any; }>(configUniqueKeyname: string, classType: { new(): T; }, query: SearchQuery): Promise<SearchResult<T>>
}
