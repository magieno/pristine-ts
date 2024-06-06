import {camelCaseColumnStrategy} from "./camel-case-column.strategy";

describe('Camel Case Column Strategy', () => {
    it('should return the same value when the column name is in camel case', () => {
        const column = 'columnName';
        const result = camelCaseColumnStrategy(column);
        expect(result).toBe(column);
    });

    it('should return the same value when the column name is in snake case', () => {
        const column = 'column_name';
        const result = camelCaseColumnStrategy(column);
        expect(result).toBe('columnName');
    });

    it("should return the same value when there's nothing to change", () => {
        const column = 'id';
        const result = camelCaseColumnStrategy(column);
        expect(result).toBe('id');
    });
});
