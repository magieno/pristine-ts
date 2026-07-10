/**
 * Per-schedule policy options. Every field is optional and defaults to a conservative,
 * safe behaviour, so `schedule(id, expression, task)` with no options is the common case.
 *
 * The type is intentionally an open interface so that future options (for example an IANA
 * `timezone`) can be added without breaking existing call sites.
 */
export interface ScheduleOptions {
  /**
   * What to do when an occurrence fires while the previous invocation of the same schedule
   * is still running.
   *
   * - `false` (default): **skip** the overlapping occurrence (a warning is logged) and wait
   *   for the next one. A schedule therefore never runs concurrently with itself.
   * - `true`: run the new invocation anyway, concurrently with the in-flight one.
   */
  allowOverlap?: boolean;

  /**
   * What to do when an occurrence is missed because the process could not fire on time
   * (for example the host slept or the event loop stalled past the occurrence).
   *
   * - `false` (default): **skip** the missed occurrence and arm for the next future one.
   * - `true`: fire **at most one** catch-up invocation on wake, then resume the normal
   *   schedule. Multiple missed occurrences still collapse into a single catch-up.
   */
  catchUp?: boolean;

  /**
   * How late (in milliseconds) a fire may be before it is considered a *missed* occurrence
   * rather than normal jitter. A fire later than this past its scheduled time is subject to
   * the {@link catchUp} policy; a fire within this tolerance always runs.
   *
   * Defaults to `5000` (5 seconds) — comfortably above event-loop jitter, far below any
   * real sleep. Lower it for sub-minute schedules that must be punctual; raise it on a
   * heavily loaded host to avoid skipping merely-jittery fires.
   */
  missedExecutionThresholdInMilliseconds?: number;
}
