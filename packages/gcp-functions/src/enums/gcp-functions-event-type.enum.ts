/**
 * Event types emitted by the GCP-Functions HTTP mappers. Used for both internal event
 * tagging and for reverse-mapping dispatch.
 */
export enum GcpFunctionsEventTypeEnum {
  /** Gen 1 HTTP-triggered Cloud Function. Express-style req/res shape. */
  CloudFunctionGen1HttpEvent = "GCP_CLOUD_FUNCTION_GEN_1_HTTP_EVENT",
  /** Gen 2 Cloud Function (Cloud Run under the hood) delivering a CloudEvent over HTTP. */
  CloudFunctionGen2HttpEvent = "GCP_CLOUD_FUNCTION_GEN_2_HTTP_EVENT",
  /** Cloud Run-hosted service receiving raw HTTP. */
  CloudRunHttpEvent = "GCP_CLOUD_RUN_HTTP_EVENT",
}
