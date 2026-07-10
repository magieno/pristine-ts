import {ConflictError} from "@pristine-ts/common";

/**
 * Thrown by `schedule(id, ...)` when the id is already registered. Registration is
 * intentionally not idempotent so that a duplicate id — almost always a bug in the
 * consumer's bootstrap — surfaces loudly instead of silently double-arming a timer. To
 * replace an existing schedule, call `unschedule(id)` first, or `reschedule(id, ...)` to
 * only change its expression.
 *
 * It extends {@link ConflictError} so it surfaces as a **409 Conflict** if it reaches an
 * HTTP boundary.
 */
export class ScheduleAlreadyExistsError extends ConflictError {
  public constructor(public readonly id: string) {
    super(`A schedule is already registered with the id '${id}'.`, {
      code: "SCHEDULE_ALREADY_EXISTS",
      details: {id},
    });
  }
}
