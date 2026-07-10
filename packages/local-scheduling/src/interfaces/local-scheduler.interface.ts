import {CronExpression} from "../models/cron-expression.model";
import {ScheduledTaskFunction} from "../types/scheduled-task-function.type";
import {ScheduleOptions} from "./schedule-options.interface";
import {ScheduledTaskDescriptor} from "./scheduled-task-descriptor.interface";

/**
 * The contract implemented by {@link LocalSchedulerManager}. Depend on this interface (via
 * the `"LocalSchedulerInterface"` injection token) when you want the scheduler mockable.
 *
 * Registration is dynamic: schedules are ordinary runtime state (typically loaded from a
 * database at bootstrap and mutated by HTTP controllers), not statically-tagged services.
 * Schedules may be registered before `start()` — they arm when the scheduler starts.
 */
export interface LocalSchedulerInterface {
  /** Whether the scheduler is currently started (armed). */
  readonly isStarted: boolean;

  /**
   * Registers a task under `id`. If the scheduler is already started, the schedule is armed
   * immediately; otherwise it arms on `start()`.
   * @throws {ScheduleAlreadyExistsError} if `id` is already registered.
   * @throws {InvalidCronExpressionError} if `cronExpression` is an invalid string.
   */
  schedule(id: string, cronExpression: string | CronExpression, task: ScheduledTaskFunction, options?: ScheduleOptions): void;

  /**
   * Removes the schedule registered under `id`, cancelling its timer. An in-flight
   * invocation is left to finish.
   * @returns `true` if a schedule was removed, `false` if none existed.
   */
  unschedule(id: string): boolean;

  /**
   * Replaces the cron expression of an existing schedule, re-arming it (options and task
   * are preserved).
   * @throws {ScheduleNotFoundError} if `id` is not registered.
   * @throws {InvalidCronExpressionError} if `cronExpression` is an invalid string.
   */
  reschedule(id: string, cronExpression: string | CronExpression): void;

  /** Whether a schedule is registered under `id`. */
  has(id: string): boolean;

  /** Returns a snapshot of every registered schedule. */
  list(): ScheduledTaskDescriptor[];

  /**
   * Returns the next armed execution date for `id` (or, if the scheduler is stopped,
   * computes it from now).
   * @throws {ScheduleNotFoundError} if `id` is not registered.
   */
  getNextExecutionDate(id: string): Date | undefined;

  /** Arms every registered schedule. Idempotent — calling it while started is a no-op. */
  start(): void;

  /**
   * Cancels every schedule's timer synchronously (no further fires occur after `stop()`
   * returns) and resolves once any in-flight task invocations have settled, so it can be
   * awaited for a graceful shutdown.
   */
  stop(): Promise<void>;
}
