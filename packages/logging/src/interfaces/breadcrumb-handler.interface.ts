import {BreadcrumbModel} from "../models/breadcrumb.model";

export interface BreadcrumbHandlerInterface {
  /**
   * The list of breadcrumbs that led to this point.
   */
  breadcrumbs: { [eventId in string]: BreadcrumbModel[] };

  /**
   * Adds a new breadcrumb to the trail. When `eventId` is omitted, the implementation
   * falls back to the active `EventContext.eventId` (if any) — so callers running
   * inside an event don't have to thread `request.id` through every call site.
   * Outside any event context AND with no explicit eventId, the breadcrumb is dropped
   * silently (we have no key to file it under).
   */
  add(eventId: string | undefined, message: string, extra?: any): void;

  /**
   * Resets all the breadcrumbs for an event.
   */
  reset(eventId: string): void;
}
