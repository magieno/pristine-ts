import { PaginationResult } from "./pagination.result";

/**
 * The list of items returned when a list query is called on DynamoDB.
 * It implements IterableIterator so that you can iterate over the items as if they were in a regular list.
 */
export class ListResult<T> implements IterableIterator<T> {
    private index: number;
    private done: boolean;

    /**
     * The list of items returned when a list query is called on DynamoDB.
     * @param _items The items returned by the query.
     * @param _paginationResult The pagination results of the query.
     */
    constructor(private _items: T[], private _paginationResult?: PaginationResult) {
        this.index = 0;
        this.done = false;
    }

    [Symbol.iterator](): ListResult<T> {
        return this;
    }

    next(): IteratorResult<T, T | undefined> {
        if(this.done){
            return {
                done: this.done,
                value: undefined,
            };
        }

        if(this.index === this._items.length){
            this.done = true;
            return {
                done: this.done,
                value: this._items[this.index],
            };
        }

        const value = this._items[this.index];
        this.index += 1;
        return {
            done: false,
            value,
        };
    }

    get paginationResult(): PaginationResult | undefined {
        return this._paginationResult;
    }

    get items(): T[] {
        return this._items;
    }
}
