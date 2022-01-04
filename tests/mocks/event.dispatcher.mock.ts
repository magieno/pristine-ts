import {Event, EventDispatcherInterface, EventResponse} from "@pristine-ts/core";

export class EventDispatcherMock implements EventDispatcherInterface{
    constructor(private readonly eventResponseMock: EventResponse<any, any>) {
    }

    dispatch(event: Event<any>): Promise<EventResponse<any, any>> {
        return Promise.resolve(this.eventResponseMock);
    }
}
