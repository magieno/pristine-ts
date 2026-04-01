/**
 * Event types for Api gateway events
 */
export enum ApiGatewayEventTypeEnum {
  /**
   * The rest api event corresponding to Api Gateway 1.0
   */
  RestApiEvent = "REST_API_EVENT",

  /**
   * The http api event corresponding to Api Gateway 2.0
   */
  HttpApiEvent = "HTTP_API_EVENT",
}
