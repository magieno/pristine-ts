import {ScheduleInterface} from "../interfaces/schedule.interface";
import {CronExpression} from "../models/cron-expression.model";

/**
 * A recurring {@link ScheduleInterface} backed by a standard cron expression. Construct it
 * from a cron string (parsed and validated immediately, throwing an
 * {@link InvalidCronExpressionError} on bad input) or from an already-built
 * {@link CronExpression}.
 *
 * ```ts
 * new CronSchedule("0 3 * * *");        // 03:00 every day
 * new CronSchedule("0/15 9-17 * * 1-5"); // every 15 minutes, 09:00-17:00, Mon-Fri
 * ```
 */
export class CronSchedule implements ScheduleInterface {
  /** The parsed cron expression backing this schedule. */
  public readonly cronExpression: CronExpression;

  constructor(cronExpression: string | CronExpression) {
    // A string is parsed (and thereby validated) here, propagating an
    // InvalidCronExpressionError (HTTP 400) for malformed input.
    this.cronExpression = typeof cronExpression === "string" ? new CronExpression(cronExpression) : cronExpression;
  }

  public getNextExecutionDate(from: Date): Date | undefined {
    return this.cronExpression.getNextExecutionDate(from);
  }

  /** Up to `count` successive occurrences after `from`. */
  public getNextExecutionDates(from: Date, count: number): Date[] {
    return this.cronExpression.getNextExecutionDates(from, count);
  }

  public toString(): string {
    return this.cronExpression.expression;
  }
}
