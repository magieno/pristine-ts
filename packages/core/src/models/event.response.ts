import {Event} from "./event";

export class EventResponse<T, R> {
    constructor(public readonly event: Event<T>, public readonly response: R) {
    }
}
