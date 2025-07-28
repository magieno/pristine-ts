import {Event} from "./event";

export class EventResponse<EventPayload, EventResponsePayload> {
  constructor(public readonly event: Event<EventPayload>, public readonly response: EventResponsePayload) {
  }
}
