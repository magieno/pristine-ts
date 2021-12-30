import { PaginationResult } from "./pagination.result";


export class ListResult<T> implements IterableIterator<T> {
    private index: number;
    private done: boolean;

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
