/**
 * Handling strategies for incoming HTTP events. Mirrors
 * `ApiGatewayEventsHandlingStrategyEnum` in `@pristine-ts/aws-api-gateway`.
 */
export enum GcpFunctionsEventsHandlingStrategyEnum {
  /** Surface the raw event payload as the Pristine event body. */
  Event = "EVENT",
  /** Map the HTTP shape into a Pristine `Request` so controllers can route on it. */
  Request = "REQUEST",
}
