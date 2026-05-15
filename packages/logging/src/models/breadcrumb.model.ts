/**
 * Wire shape for one entry in the breadcrumb trail attached to a log entry.
 *
 * @deprecated Prefer the spans-based path going forward: use `@traced` /
 * `runWithSpan` for method-boundary trail entries, and
 * `tracingManager.addEventToCurrentSpan(message, attributes?)` for mid-method markers.
 * Both produce trail entries that flow through the same renderer in error logs as
 * `BreadcrumbModel` does today. `BreadcrumbModel` survives because the LogHandler still
 * accepts manual entries from `BreadcrumbHandler` and merges them with span-derived
 * entries — but new code shouldn't reach for this class directly. It will be removed
 * in a future major.
 */
export class BreadcrumbModel {
  /**
   * The date at which the breadcrumb was created.
   */
  date: Date = new Date();

  /**
   * The message identifying the breadcrumb.
   */
  message: string

  /**
   * Extra information attached to the breadcrumb.
   */
  extra?: any;

  constructor(
    message: string,
    extra?: any,
  ) {
    this.message = message;
    this.extra = extra;
  }
}
