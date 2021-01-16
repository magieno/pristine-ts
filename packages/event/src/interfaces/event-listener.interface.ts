import {Event} from "../models/event";

export interface EventListenerInterface {
    supports<T>(event: Event<T>): boolean;

    handle<T>(event: Event<T>): Promise<void>;
}