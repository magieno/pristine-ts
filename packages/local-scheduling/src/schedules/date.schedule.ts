import {ScheduleInterface} from "../interfaces/schedule.interface";

/**
 * A one-shot {@link ScheduleInterface} that fires a single time at a fixed instant. Once that
 * instant has passed, {@link getNextExecutionDate} returns `undefined`, so the scheduler
 * fires it once and then leaves it unarmed — it remains listed, with no next execution date.
 *
 * ```ts
 * new DateSchedule(new Date("2026-12-31T23:59:00"));
 * ```
 */
export class DateSchedule implements ScheduleInterface {
  /** The single instant at which this schedule fires. */
  public readonly date: Date;

  constructor(date: Date) {
    this.date = date;
  }

  public getNextExecutionDate(from: Date): Date | undefined {
    // Strictly after `from`, mirroring cron semantics; a copy is returned so callers cannot
    // mutate the schedule's own instant.
    return this.date.getTime() > from.getTime() ? new Date(this.date.getTime()) : undefined;
  }

  public toString(): string {
    return this.date.toISOString();
  }
}
