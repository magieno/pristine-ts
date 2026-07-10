/**
 * A read-only snapshot of a registered schedule, returned by `LocalSchedulerManager.list()`.
 * Useful for building a "next runs" view or an admin listing of active schedules.
 */
export interface ScheduledTaskDescriptor {
  /** The id the schedule is registered under. */
  id: string;

  /** The normalized cron expression string. */
  expression: string;

  /** Whether an invocation of this schedule is currently in-flight. */
  isRunning: boolean;

  /**
   * The next armed execution date, or `undefined` when the scheduler is stopped or the
   * expression has no upcoming occurrence.
   */
  nextExecutionDate?: Date;
}
