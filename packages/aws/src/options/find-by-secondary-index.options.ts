import { ListOptions } from "./list.options";

export interface FindBySecondaryIndexOptions<T> extends ListOptions<T> {
    keyCondition: { [propertyName: string]: string | boolean | number },
    secondaryIndexName: string,
    filterKeysAndValues?: { [key: string]: string | number | boolean | string[] | number[]},
    expiresAtFilter?: { [key: string]: number | Date },
}
