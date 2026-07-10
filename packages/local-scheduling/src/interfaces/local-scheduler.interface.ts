import {ScheduleInterface} from "./schedule.interface";
import {ScheduledTaskFunction} from "../types/scheduled-task-function.type";
import {ScheduleOptions} from "./schedule-options.interface";
import {ScheduleDescriptor} from "./schedule-descriptor.interface";

/**
 * The contract implemented by {@link LocalSchedulerManager}. Depend on this interface (via the
 * `"LocalSchedulerInterface"` injection token) when you want the scheduler mockable.
 *
 * Schedules come from two places that share one id space: statically-tagged
 * {@link SchedulableInterface} tasks (auto-registered on `start()`), and the dynamic methods
 * below — ordinary runtime state, typically loaded from a database at bootstrap and mutated by
 * HTTP controllers. Schedules may be registered before `start()`; they arm when it is called.
 */
export interface LocalSchedulerInterface {
  /** Whether the scheduler is currently started (armed). */
  readonly isStarted: boolean;

  /**
   * Registers a task under `id`, run on `schedule` — a {@link ScheduleInterface} (e.g. a
   * {@link CronSchedule} or {@link DateSchedule}) or a cron string as shorthand for a
   * {@link CronSchedule}. If the scheduler is already started, the schedule arms immediately;
   * otherwise it arms on `start()`.
   * @throws {ScheduleAlreadyExistsError} if `id` is already registered.
   * @throws {InvalidCronExpressionError} if `schedule` is an invalid cron string.
   */
  schedule(id: string, schedule: ScheduleInterface | string, task: ScheduledTaskFunction, options?: ScheduleOptions): void;

  /**
   * Removes the schedule registered under `id`, cancelling its timer. An in-flight invocation
   * is left to finish.
   * @returns `true` if a schedule was removed, `false` if none existed.
   */
  unschedule(id: string): boolean;

  /**
   * Replaces the schedule of an existing registration, re-arming it (options and task are
   * preserved). Accepts a {@link ScheduleInterface} or a cron string.
   * @throws {ScheduleNotFoundError} if `id` is not registered.
   * @throws {InvalidCronExpressionError} if `schedule` is an invalid cron string.
   */
  reschedule(id: string, schedule: ScheduleInterface | string): void;

  /** Whether a schedule is registered under `id`. */
  has(id: string): boolean;

  /** Returns a snapshot of every registered schedule. */
  list(): ScheduleDescriptor[];

  /**
   * Returns the next armed execution date for `id` (or, if the scheduler is stopped, computes
   * it from now).
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
