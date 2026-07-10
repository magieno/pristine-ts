import {CronExpression} from "../models/cron-expression.model";
import {ScheduledTaskFunction} from "../types/scheduled-task-function.type";

/**
 * The fully-resolved internal state of one registered schedule, held by
 * `LocalSchedulerManager`. This is an implementation detail — it is intentionally **not**
 * re-exported from the module's public barrel; `ScheduledTaskDescriptor` is the public,
 * read-only view of a schedule.
 */
export interface ScheduledTaskState {
  id: string;
  cronExpression: CronExpression;
  task: ScheduledTaskFunction;
  allowOverlap: boolean;
  catchUp: boolean;
  missedExecutionThresholdInMilliseconds: number;

  /** The currently-armed timer handle, if any. */
  timeout?: ReturnType<typeof setTimeout>;

  /** The epoch (ms) of the occurrence the timer is currently working towards. */
  armedTargetEpoch?: number;

  /** The next armed execution date (mirror of {@link ScheduledTaskState.armedTargetEpoch} as a `Date`). */
  nextExecutionDate?: Date;

  /** Whether an invocation of this schedule is currently in-flight. */
  running: boolean;
}
