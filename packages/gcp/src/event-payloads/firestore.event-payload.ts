/**
 * The Pristine event payload for a parsed GCP Firestore document-change CloudEvent.
 * Mirrors `DynamodbEventPayload` in spirit.
 */
export class FirestoreEventPayload {
  /**
   * The CloudEvent `type` (e.g. `google.cloud.firestore.document.v1.created`).
   */
  eventType: string;

  /**
   * The CloudEvent `source` (e.g. `//firestore.googleapis.com/projects/p/databases/(default)`).
   */
  source: string;

  /**
   * The CloudEvent `time`, parsed.
   */
  eventTime?: Date;

  /**
   * The full document path that changed (e.g. `projects/p/databases/(default)/documents/users/abc`).
   */
  documentPath: string;

  /**
   * The Firestore document value after the change. Absent for `deleted` events.
   * Keys are field names, values are Firestore-wire values (e.g. `{stringValue: "..."}`).
   */
  value?: { [field: string]: any };

  /**
   * The document value before the change. Absent for `created` events.
   */
  oldValue?: { [field: string]: any };

  /**
   * Field paths that changed (Firestore provides this only on `written`/`updated` events).
   */
  updateMask?: string[];

  /**
   * The raw `data` field from the CloudEvent — verbatim.
   */
  data: any;
}
