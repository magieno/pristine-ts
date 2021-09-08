/**
 * This model defines what an Event is in the Pristine library.
 * Once an event parsed, this should be the only object that will be handle inside the library.
 */
export class Event<T> {
    type: string;
    payload: T;
}
