import {ColumnNamingStrategyType} from "../types/column-naming-strategy.type";

export const camelCaseColumnStrategy: ColumnNamingStrategyType = (column: string) => {
  return column.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}