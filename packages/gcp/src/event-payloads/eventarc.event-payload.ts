/**
 * The Pristine event payload for any CloudEvent that didn't match a more-specific
 * mapper. Mirrors the role of `EventBridgePayload` for AWS.
 */
export class EventarcEventPayload {
  /**
   * CloudEvent `id`.
   */
  id: string;

  /**
   * CloudEvent `specversion`.
   */
  specVersion: string;

  /**
   * CloudEvent `type`.
   */
  type: string;

  /**
   * CloudEvent `source`.
   */
  source: string;

  /**
   * CloudEvent `subject`, if present.
   */
  subject?: string;

  /**
   * CloudEvent `time`, parsed if present.
   */
  time?: Date;

  /**
   * CloudEvent `datacontenttype`, if present.
   */
  dataContentType?: string;

  /**
   * The CloudEvent `data` payload, verbatim. Type-agnostic on purpose — this is the
   * catch-all mapper.
   */
  data: any;
}
