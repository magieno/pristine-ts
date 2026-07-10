import {CronExpression} from "../models/cron-expression.model";
import {ScheduleOptions} from "./schedule-options.interface";

/**
 * The schedule a {@link CronScheduledTaskInterface} declares for itself. Returned from the
 * task's `getScheduleConfiguration()`, it is evaluated when the scheduler starts — so the
 * task may compute it from injected dependencies (configuration, a database, etc.).
 */
export interface CronScheduledTaskConfiguration {
  /**
   * The unique id the task is registered under. Required (rather than derived from the
   * class name) so it stays stable under bundling/minification and reads intentionally at
   * the call site. It shares the id space with dynamically-registered schedules.
   */
  id: string;

  /** The cron expression, as a string (parsed/validated on registration) or a `CronExpression`. */
  cronExpression: string | CronExpression;

  /** Optional per-schedule policies (overlap, catch-up, missed threshold). */
  options?: ScheduleOptions;
}
