/**
 * The context object passed to a scheduled task function on each invocation. It is a
 * distinct, optional-to-consume argument, so a plain `() => Promise<void>` task remains
 * assignable — consumers only reach for it when they need the fire metadata.
 */
export interface ScheduledTaskInvocationContext {
  /** The id the task was registered under. */
  id: string;

  /**
   * The scheduled occurrence this invocation corresponds to (the cron-computed date).
   * This is the intended time, not necessarily the wall-clock time the task actually
   * started — see {@link invocationDate}.
   */
  scheduledExecutionDate: Date;

  /** The wall-clock time at which this invocation actually started. */
  invocationDate: Date;

  /**
   * `true` when this invocation is a single catch-up for an occurrence that was missed
   * (for example because the host was asleep) and the schedule opted in with
   * `catchUp: true`. `false` for normal, on-time invocations.
   */
  isCatchUp: boolean;
}
