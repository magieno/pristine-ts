import {CronExpression} from "../models/cron-expression.model";
import {CronSchedule} from "../schedules/cron.schedule";

/**
 * A fluent builder for cron expressions, so a caller can compose a schedule from typed,
 * self-describing method calls instead of hand-writing (and mis-remembering) the five-field
 * syntax.
 *
 * Every method returns `this` for chaining, and each field defaults to `*` ("every"), so you
 * only set the fields you care about — a fresh builder is already "every minute". Each method
 * sets exactly the field it names (last write wins per field); nothing is validated until
 * {@link build} (or {@link toSchedule}) constructs a {@link CronExpression}, which throws an
 * `InvalidCronExpressionError` on an out-of-range value.
 *
 * ```ts
 * new CronExpressionBuilder().dailyAt(3).build();                 // 0 3 * * *
 * new CronExpressionBuilder().everyMinutes(15).hoursBetween(9, 17)
 *   .onDayOfWeek(DayOfWeekEnum.Monday, DayOfWeekEnum.Friday).build();
 * new CronExpressionBuilder().weeklyOn(DayOfWeekEnum.Sunday, 2, 30).toSchedule();
 * ```
 *
 * Month and day-of-week take plain numbers; {@link MonthEnum} and {@link DayOfWeekEnum} are
 * exported so call sites can read `inMonth(MonthEnum.January)` instead of `inMonth(1)`.
 */
export class CronExpressionBuilder {
  /** Optional sixth (seconds) field; `undefined` keeps the expression in classic 5-field form. */
  private secondField?: string;
  private minuteField: string = "*";
  private hourField: string = "*";
  private dayOfMonthField: string = "*";
  private monthField: string = "*";
  private dayOfWeekField: string = "*";

  // ── seconds (optional sixth field; setting any of these switches to 6-field form) ──────────

  public atSecond(second: number, ...more: number[]): this {
    this.secondField = [second, ...more].join(",");
    return this;
  }

  public everySeconds(step: number): this {
    this.secondField = CronExpressionBuilder.step(step);
    return this;
  }

  public secondsBetween(start: number, end: number, step?: number): this {
    this.secondField = CronExpressionBuilder.range(start, end, step);
    return this;
  }

  // ── minutes ────────────────────────────────────────────────────────────────────────────────

  public atMinute(minute: number, ...more: number[]): this {
    this.minuteField = [minute, ...more].join(",");
    return this;
  }

  public everyMinutes(step: number): this {
    this.minuteField = CronExpressionBuilder.step(step);
    return this;
  }

  public minutesBetween(start: number, end: number, step?: number): this {
    this.minuteField = CronExpressionBuilder.range(start, end, step);
    return this;
  }

  // ── hours ────────────────────────────────────────────────────────────────────────────────

  public atHour(hour: number, ...more: number[]): this {
    this.hourField = [hour, ...more].join(",");
    return this;
  }

  public everyHours(step: number): this {
    this.hourField = CronExpressionBuilder.step(step);
    return this;
  }

  public hoursBetween(start: number, end: number, step?: number): this {
    this.hourField = CronExpressionBuilder.range(start, end, step);
    return this;
  }

  // ── day of month ─────────────────────────────────────────────────────────────────────────

  public onDayOfMonth(day: number, ...more: number[]): this {
    this.dayOfMonthField = [day, ...more].join(",");
    return this;
  }

  public everyDaysOfMonth(step: number): this {
    this.dayOfMonthField = CronExpressionBuilder.step(step);
    return this;
  }

  public daysOfMonthBetween(start: number, end: number, step?: number): this {
    this.dayOfMonthField = CronExpressionBuilder.range(start, end, step);
    return this;
  }

  // ── month (1-12; pass MonthEnum values for readability) ──────────────────────────────────

  public inMonth(month: number, ...more: number[]): this {
    this.monthField = [month, ...more].join(",");
    return this;
  }

  public monthsBetween(start: number, end: number, step?: number): this {
    this.monthField = CronExpressionBuilder.range(start, end, step);
    return this;
  }

  // ── day of week (0-7, 0 and 7 = Sunday; pass DayOfWeekEnum values) ───────────────────────

  public onDayOfWeek(day: number, ...more: number[]): this {
    this.dayOfWeekField = [day, ...more].join(",");
    return this;
  }

  public daysOfWeekBetween(start: number, end: number, step?: number): this {
    this.dayOfWeekField = CronExpressionBuilder.range(start, end, step);
    return this;
  }

  // ── high-level helpers (each sets only the fields it names) ──────────────────────────────

  /** Every hour, at the given minute — e.g. `hourlyAtMinute(30)` is "30 * * * *". */
  public hourlyAtMinute(minute: number): this {
    this.minuteField = String(minute);
    this.hourField = "*";
    return this;
  }

  /** Every day at the given hour and minute — e.g. `dailyAt(3, 30)` is "30 3 * * *". */
  public dailyAt(hour: number, minute: number = 0): this {
    this.minuteField = String(minute);
    this.hourField = String(hour);
    return this;
  }

  /** The given day-of-week each week, at the given hour and minute. */
  public weeklyOn(dayOfWeek: number, hour: number, minute: number = 0): this {
    this.minuteField = String(minute);
    this.hourField = String(hour);
    this.dayOfWeekField = String(dayOfWeek);
    return this;
  }

  /** The given day-of-month each month, at the given hour and minute. */
  public monthlyOn(dayOfMonth: number, hour: number, minute: number = 0): this {
    this.minuteField = String(minute);
    this.hourField = String(hour);
    this.dayOfMonthField = String(dayOfMonth);
    return this;
  }

  // ── terminals ────────────────────────────────────────────────────────────────────────────

  /** The assembled cron string (5 fields, or 6 when a seconds field has been set). */
  public toString(): string {
    const fields = [this.minuteField, this.hourField, this.dayOfMonthField, this.monthField, this.dayOfWeekField];
    return (this.secondField !== undefined ? [this.secondField, ...fields] : fields).join(" ");
  }

  /**
   * Parses and validates the assembled expression into a {@link CronExpression}.
   * @throws {InvalidCronExpressionError} if any set value is out of range.
   */
  public build(): CronExpression {
    return new CronExpression(this.toString());
  }

  /** Convenience for the scheduler: the assembled expression as a {@link CronSchedule}. */
  public toSchedule(): CronSchedule {
    return new CronSchedule(this.build());
  }

  /** Assembles a step field (`*` every `step`). */
  private static step(step: number): string {
    return `*/${step}`;
  }

  /** Assembles a range field (`start-end`, optionally stepped `start-end/step`). */
  private static range(start: number, end: number, step?: number): string {
    return step === undefined ? `${start}-${end}` : `${start}-${end}/${step}`;
  }
}
