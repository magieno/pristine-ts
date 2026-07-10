/**
 * A schedule tells the scheduler *when* a task should next run. It is deliberately
 * polymorphic: a {@link CronSchedule} recurs on a cron expression, a {@link DateSchedule}
 * fires once at a fixed instant, and future schedule kinds (a fixed interval, calendar
 * rules, ...) can implement the same contract without any change to the scheduler.
 *
 * The scheduler drives a schedule purely through {@link getNextExecutionDate}: it asks for
 * the next occurrence, arms a timer for it, and — after firing — asks again. A schedule that
 * returns `undefined` has no further occurrence and is left unarmed (a one-shot that has
 * already fired, or a cron that never matches).
 */
export interface ScheduleInterface {
  /**
   * The next occurrence strictly after `from`, or `undefined` if this schedule has no
   * further occurrence.
   */
  getNextExecutionDate(from: Date): Date | undefined;

  /** A short, human-readable description of the schedule, used in logs and `list()`. */
  toString(): string;
}
