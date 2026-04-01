/**
 * Handling strategies for Api gateway events
 */
export enum ApiGatewayEventsHandlingStrategyEnum {
  /**
   * Handle Api gateway as an Event.
   */
  Event = "EVENT",

  /**
   * Handle Api gateway event as a request.
   */
  Request = "REQUEST",
}
