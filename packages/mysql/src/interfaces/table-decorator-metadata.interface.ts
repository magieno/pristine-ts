import {ColumnNamingStrategyType} from "../types/column-naming-strategy.type";

export interface TableDecoratorMetadataInterface {
    tableName: string;

    autoColumnNamingStrategy?: ColumnNamingStrategyType;
    autoColumnNamingStrategyReverse?: ColumnNamingStrategyType;
}
