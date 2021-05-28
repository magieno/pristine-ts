import {Event} from "../models/event";

export interface EventParserInterface<T> {
    supports(event: any): boolean;

    parse(event: any): Event<T>[];
}
