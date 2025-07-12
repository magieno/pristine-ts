import {BreadcrumbModel} from "../models/breadcrumb.model";

export interface BreadcrumbHandlerInterface {
  /**
   * The list of breadcrumbs that led to this point.
   */
  breadcrumbs: BreadcrumbModel[];

  /**
   * Adds a new breadcrumb to the trail.
   *
   * @param message
   * @param extra
   */
  add(message: string, extra?:any): void;
}