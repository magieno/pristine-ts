import "reflect-metadata"
import {DynamodbClient} from "./dynamodb.client";
import {DynamodbError} from "../errors/dynamodb.error";
import {DynamodbItemNotFoundError} from "../errors/dynamodb-item-not-found.error";
import {DynamodbItemAlreadyExistsError} from "../errors/dynamodb-item-already-exists.error";
import {DynamodbTableNotFoundError} from "../errors/dynamodb-table-not-found.error";
import {DynamodbValidationError} from "../errors/dynamodb-validation.error";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {DynamoDbTable} from "@awslabs-community-fork/dynamodb-data-mapper";
import {ListResult} from "../results/list.result";
import {PaginationResult} from "../results/pagination.result";

describe("Dynamodb client", () => {
  const logHandlerMock: LogHandlerInterface = {
    critical(message: string, extra?: any): void {
    }, debug(message: string, extra?: any): void {
    }, error(message: string, extra?: any): void {
    }, info(message: string, extra?: any): void {
    }, notice(message: string, extra?: any): void {
    }, warning(message: string, extra?: any): void {
    }, terminate() {
    }
  }
  const client = new DynamodbClient(logHandlerMock, "us-east-1");

  
  describe("createFilterConditions", () => {
    it("should create a simple filter condition for a string.", () => {
      expect(client["createFilterConditions"]({"key": "value"})).toEqual([{
        type: 'Equals',
        object: 'value',
        subject: 'key'
      }]);
    })

    it("should create a simple filter condition for a number.", () => {
      expect(client["createFilterConditions"]({"key": 1})).toEqual([{type: 'Equals', object: 1, subject: 'key'}]);
    })

    it("should create a simple filter condition for a boolean.", () => {
      expect(client["createFilterConditions"]({"key": true})).toEqual([{
        type: 'Equals',
        object: true,
        subject: 'key'
      }]);
    })

    it("should create an OR filter condition for an array of string.", () => {
      expect(client["createFilterConditions"]({"key": ["value1", "value2"]})).toEqual(
        [
          {
            type: 'Or',
            conditions: [
              {type: 'Equals', object: 'value1', subject: 'key'},
              {type: 'Equals', object: 'value2', subject: 'key'}
            ]
          }
        ]
      );
    })

    it("should create an OR filter condition for an array of number.", () => {
      expect(client["createFilterConditions"]({"key": [1, 2]})).toEqual(
        [
          {
            type: 'Or',
            conditions: [
              {type: 'Equals', object: 1, subject: 'key'},
              {type: 'Equals', object: 2, subject: 'key'}
            ]
          }
        ]
      );
    })

    it("should create an array of filter condition for multiple keys.", () => {
      expect(client["createFilterConditions"]({"key": [1, 2], "key2": "value"})).toEqual(
        [
          {
            type: 'Or',
            conditions: [
              {type: 'Equals', object: 1, subject: 'key'},
              {type: 'Equals', object: 2, subject: 'key'}
            ]
          },
          {type: 'Equals', object: 'value', subject: 'key2'}
        ]
      );
    })
  });

  describe("createExpiresAtFilter", () => {
    it("should create an expires at filter condition when a date is specified.", () => {
      expect(client["createExpiresAtFilter"]({"key": new Date(1617314868000)})).toEqual(
        {type: 'GreaterThan', object: 1617314868, subject: 'key'}
      );
    })

    it("should create an expires at filter condition when a number is specified.", () => {
      expect(client["createExpiresAtFilter"]({"key": 1617314868})).toEqual(
        {type: 'GreaterThan', object: 1617314868, subject: 'key'}
      );
    })
  });

  describe("createFilterExpression", () => {
    it("should return undefined if no filterKeysAndValues or expiresAt filter are specified.", () => {
      expect(client["createFilterExpression"]()).toEqual(undefined);
    });

    it("should return only one condition if a filterKeysAndValues and no expiresAt filter are specified.", () => {
      expect(client["createFilterExpression"]({"key": "value"})).toEqual({
        type: 'Equals',
        object: 'value',
        subject: 'key'
      });
    });

    it("should return only one condition if no filterKeysAndValues and an expiresAt filter are specified.", () => {
      expect(client["createFilterExpression"](undefined, {"key": 1617314868})).toEqual(
        {type: 'GreaterThan', object: 1617314868, subject: 'key'}
      );
    });

    it("should return an AND condition if multiple filterKeysAndValues and no expiresAt filter are specified.", () => {
      expect(client["createFilterExpression"]({"key": [1, 2], "key2": "value"})).toEqual(
        {
          type: 'And',
          conditions: [
            {
              type: 'Or', conditions: [
                {type: 'Equals', object: 1, subject: 'key'},
                {type: 'Equals', object: 2, subject: 'key'}
              ]
            },
            {type: 'Equals', object: 'value', subject: 'key2'}
          ]
        }
      );
    });

    it("should return an AND condition if a filterKeysAndValues and an expiresAt filter are specified.", () => {
      expect(client["createFilterExpression"]({"key": [1, 2]}, {"key": 1617314868})).toEqual(
        {
          type: 'And',
          conditions: [
            {
              type: 'Or', conditions: [
                {type: 'Equals', object: 1, subject: 'key'},
                {type: 'Equals', object: 2, subject: 'key'}
              ]
            },
            {type: 'GreaterThan', object: 1617314868, subject: 'key'}
          ]
        }
      );
    });

    it("should return an AND condition if multiple filterKeysAndValues and an expiresAt filter are specified.", () => {
      expect(client["createFilterExpression"]({"key": [1, 2], "key2": "value"}, {"key": 1617314868})).toEqual(
        {
          type: 'And',
          conditions: [
            {
              type: 'Or', conditions: [
                {type: 'Equals', object: 1, subject: 'key'},
                {type: 'Equals', object: 2, subject: 'key'}
              ]
            },
            {type: 'Equals', object: 'value', subject: 'key2'},
            {type: 'GreaterThan', object: 1617314868, subject: 'key'}
          ]
        }
      );
    });
  });

  describe("convertError", () => {
    it("should not convert an error that is or extends DynamodbError.", () => {
      expect(client["convertError"](new DynamodbError())).toEqual(new DynamodbError());
      expect(client["convertError"](new DynamodbItemNotFoundError())).toEqual(new DynamodbItemNotFoundError());
      expect(client["convertError"](new DynamodbItemAlreadyExistsError())).toEqual(new DynamodbItemAlreadyExistsError());
      expect(client["convertError"](new DynamodbTableNotFoundError())).toEqual(new DynamodbTableNotFoundError());
      expect(client["convertError"](new DynamodbValidationError())).toEqual(new DynamodbValidationError());
    })

    it("should convert a resource not found error into DynamodbTableNotFoundError.", () => {
      const error = new Error();
      error.name = "ResourceNotFoundException";
      expect(client["convertError"](error)).toEqual(new DynamodbTableNotFoundError());
    })

    it("should convert an item not found into DynamodbItemNotFoundError.", () => {
      const error = new Error();
      error.name = "ItemNotFoundException";
      expect(client["convertError"](error)).toEqual(new DynamodbItemNotFoundError());
    })

    it("should convert a validation error into DynamodbValidationError.", () => {
      const error = new Error();
      error.name = "ValidationException";
      expect(client["convertError"](error)).toEqual(new DynamodbValidationError());
    })

    it("should convert a random error into DynamodbError.", () => {
      const error = new Error();
      error.name = "Random";
      expect(client["convertError"](error)).toEqual(new DynamodbError("Unknown dynamodb error: Random"));
    })

    it("should convert a random error with no name into DynamodbError.", () => {
      const error = new Error();
      expect(client["convertError"](error)).toEqual(new DynamodbError("Unknown dynamodb error"));
    })
  });

  describe("createItemOfClassWithPrimaryKey", () => {
    class A {
      attribute1: string;
      attribute2?: string;
    }

    it("should create an object with the primary key set to the value.", () => {
      const a = new A();
      a.attribute1 = "value";
      expect(client["createItemOfClassWithPrimaryKey"](A, {"attribute1": "value"})).toEqual(a);
    })
  });

  describe("getTableName", () => {
    class A {
      attribute1: string;
      attribute2?: string;
    }

    it("should get a table name.", () => {
      const a = new A();
      a.constructor.prototype[DynamoDbTable] = "TableA";
      expect(client["getTableName"](a.constructor.prototype)).toEqual("TableA");
      expect(client["getTableName"](A.prototype)).toEqual("TableA");
    })
  });

  describe("iterator", () => {
    class Item {
      constructor(public value: number) {
      }
    }

    it("should iterate over the items of a list result", () => {
      const items = [new Item(1), new Item(2), new Item(3)];
      const paginationResult: PaginationResult = {
        count: 3,
        lastEvaluatedKey: {
          item: 3
        }
      }
      const result = new ListResult<Item>(items, paginationResult);
      expect(result.paginationResult?.count).toBe(3);
      expect(result.paginationResult?.lastEvaluatedKey?.item).toBe(3);
      let counter = 0;
      for (const item of result) {
        counter += 1;
        expect(item.value).toBe(counter);
      }
      expect(counter).toBe(3);
    })
  });
})
