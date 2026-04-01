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