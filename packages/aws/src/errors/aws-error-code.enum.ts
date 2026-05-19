/**
 * Error-code catalog owned by `@pristine-ts/aws`. Surfaced via `PristineErrorOptions.code`
 * (typed `PristineErrorCode | string`, so any enum value is accepted).
 *
 * Codes here describe failures from AWS service clients wrapped by this module — SES,
 * SQS, EventBridge, etc.
 */
export enum AwsErrorCode {
  SesSendFailed         = "SES_SEND_FAILED",
  SqsSendFailed         = "SQS_SEND_FAILED",
  EventBridgeSendFailed = "EVENT_BRIDGE_SEND_FAILED",
}
