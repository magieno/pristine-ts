import {FilteringOperatorEnum} from "../enums/filtering-operator.enum";

export class SearchFieldFilter {
  /**
   * The name of the field to filter.
   */
  field: string;

  /**
   * The value to filter.
   */
  value: string;

  /**
   * The operator to use to filter.
   */
  operator: FilteringOperatorEnum;

  constructor(field: string, operator: FilteringOperatorEnum, value: string) {
    this.field = field;
    this.value = value;
    this.operator = operator;
  }
}