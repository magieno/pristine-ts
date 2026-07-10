import {ScheduleInterface} from "./schedule.interface";

/**
 * A read-only snapshot of a registered schedule, returned by `LocalSchedulerManager.list()`.
 * Useful for building a "next runs" view or an admin listing of active schedules.
 */
export interface ScheduleDescriptor {
  /** The id the schedule is registered under. */
  id: string;

  /**
   * The schedule that determines when the task runs — a {@link CronSchedule},
   * {@link DateSchedule}, or any other {@link ScheduleInterface}. Its `toString()` gives a
   * human-readable form.
   */
  schedule: ScheduleInterface;

  /** Whether an invocation of this schedule is currently in-flight. */
  isRunning: boolean;

  /**
   * The next armed execution date, or `undefined` when the scheduler is stopped or the
   * schedule has no further occurrence.
   */
  nextExecutionDate?: Date;
}
