import {BreadcrumbModel} from "../models/breadcrumb.model";

export interface BreadcrumbHandlerInterface {
  /**
   * The list of breadcrumbs that led to this point.
   */
  breadcrumbs: {[eventId in string]: BreadcrumbModel[]};

  /**
   * Adds a new breadcrumb to the trail.
   *
   * @param eventId
   * @param message
   * @param extra
   */
  add(eventId: string, message: string, extra?:any): void;

  /**
   * Resets all the breadcrumbs.
   */
  reset(eventId: string): void;
}