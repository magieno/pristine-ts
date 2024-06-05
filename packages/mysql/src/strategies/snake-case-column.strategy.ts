import {ColumnNamingStrategyType} from "../types/column-naming-strategy.type";

export const snakeCaseColumnStrategy: ColumnNamingStrategyType = (column: string) => {
  return column.replace(/([A-Z])/g, "_$1").toLowerCase();
}