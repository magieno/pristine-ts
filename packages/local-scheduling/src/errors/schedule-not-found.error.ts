import {NotFoundError} from "@pristine-ts/common";

/**
 * Thrown when an operation references a schedule id that is not registered (for example
 * `reschedule(id, ...)` or `getNextExecutionDate(id)` on an unknown id).
 *
 * It extends {@link NotFoundError} so it surfaces as a **404 Not Found** if it reaches an
 * HTTP boundary — convenient when a controller mutates schedules by id.
 */
export class ScheduleNotFoundError extends NotFoundError {
  public constructor(public readonly id: string) {
    super(`No schedule is registered with the id '${id}'.`, {
      code: "SCHEDULE_NOT_FOUND",
      details: {id},
    });
  }
}
