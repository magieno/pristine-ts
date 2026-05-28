/**
 * Event types from Eventarc / generic CloudEvents that aren't claimed by a more
 * specific mapper. The mapper falls through to `EventarcEvent`.
 */
export enum EventarcEventType {
  EventarcEvent = "EVENTARC_EVENT",
}
