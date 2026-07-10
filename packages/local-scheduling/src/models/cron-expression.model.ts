import {InvalidCronExpressionError} from "../errors/invalid-cron-expression.error";

/**
 * A parsed, validated standard cron expression, and the engine that computes its upcoming
 * execution dates.
 *
 * **Supported syntax** (standard 5-field cron, plus an optional leading seconds field):
 *
 * ```
 * ┌───────────── second (0-59)          (optional 6th field; omit for classic 5-field cron)
 * │ ┌─────────── minute (0-59)
 * │ │ ┌───────── hour (0-23)
 * │ │ │ ┌─────── day-of-month (1-31)
 * │ │ │ │ ┌───── month (1-12 or JAN-DEC)
 * │ │ │ │ │ ┌─── day-of-week (0-7 or SUN-SAT; 0 and 7 are both Sunday)
 * │ │ │ │ │ │
 * * * * * * *
 * ```
 *
 * Each field accepts `*`, single values, ranges (`a-b`), lists (`a,b,c`), and steps
 * (`* / n`, `a-b/n`, `a/n` meaning "from a to the maximum, every n"). Month and day-of-week
 * values may be given as case-insensitive names. Ranges must be ascending; wrap-around
 * ranges such as `FRI-SUN` are not supported — express them as a list (`FRI,SAT,SUN`).
 *
 * **Day-of-month / day-of-week OR rule:** when *both* the day-of-month and day-of-week
 * fields are restricted (neither is `*`), the expression matches when *either* field
 * matches — the classic Vixie-cron behaviour. For example `30 4 1,15 * 5` runs at 04:30 on
 * the 1st and 15th of the month **and** every Friday. When at least one of the two is `*`,
 * the fields combine with AND (the `*` one matching everything). A field is considered
 * "restricted" whenever its text is not exactly `*` — so a starred field carrying a step
 * (every-N) still counts as restricted.
 *
 * **Time semantics:** all computations use the host's **system local time** (via the
 * standard `Date`). Across a spring-forward DST transition, a local time that does not
 * exist is skipped; across a fall-back transition, a repeated local time fires once. A
 * future revision may accept an IANA timezone without changing this class's method
 * signatures (a timezone would be supplied as an additional, optional constructor option).
 */
export class CronExpression {
  /**
   * Case-insensitive month names accepted in the month field, mapped to their `1-12` value.
   */
  private static readonly MONTH_NAMES: Readonly<Record<string, number>> = {
    JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
    JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
  };

  /**
   * Case-insensitive day-of-week names accepted in the day-of-week field, mapped to their
   * `0-6` value where `0` is Sunday (the classic cron convention).
   */
  private static readonly DAY_OF_WEEK_NAMES: Readonly<Record<string, number>> = {
    SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
  };

  /**
   * The upper bound (in years past the `from` date) of the forward scan performed when
   * computing the next execution. Eight years is the largest gap between two consecutive
   * occurrences of Feb 29 (e.g. 2096 → 2104, because 2100 is not a leap year), so any
   * expression that ever matches is guaranteed to match within this window. An expression
   * that does not match within it is treated as never-matching (e.g. `0 0 30 2 *`).
   */
  private static readonly MAX_SCAN_YEARS = 8;

  /**
   * A hard iteration ceiling on the forward scan, as a defensive backstop against an
   * unforeseen non-advancing state. The scan advances by at least one calendar field per
   * iteration and is really bounded by {@link CronExpression.MAX_SCAN_YEARS}; this ceiling
   * only ever trips on a bug, never on legitimate input.
   */
  private static readonly MAX_SCAN_ITERATIONS = 1_000_000;

  /** The normalized expression (trimmed, single-spaced). */
  public readonly expression: string;

  /** Whether this expression carries a leading seconds field (6-field form). */
  public readonly hasSecondsField: boolean;

  private readonly seconds: ReadonlySet<number>;
  private readonly minutes: ReadonlySet<number>;
  private readonly hours: ReadonlySet<number>;
  private readonly daysOfMonth: ReadonlySet<number>;
  private readonly months: ReadonlySet<number>;
  private readonly daysOfWeek: ReadonlySet<number>;
  private readonly dayOfMonthRestricted: boolean;
  private readonly dayOfWeekRestricted: boolean;

  /**
   * Parses and validates the expression.
   * @param expression A 5-field (or 6-field, seconds-leading) standard cron expression.
   * @throws {InvalidCronExpressionError} if the expression is malformed or out of range.
   *   The error carries an HTTP 400 status and a precise message.
   */
  public constructor(expression: string) {
    if (typeof expression !== "string") {
      throw new InvalidCronExpressionError("A cron expression must be a string.", String(expression));
    }

    const normalized = expression.trim().replace(/\s+/g, " ");
    if (normalized.length === 0) {
      throw new InvalidCronExpressionError("A cron expression cannot be empty.", expression);
    }

    const fields = normalized.split(" ");
    if (fields.length !== 5 && fields.length !== 6) {
      throw new InvalidCronExpressionError(
        `A cron expression must have 5 fields (minute hour day-of-month month day-of-week), ` +
        `or 6 fields with a leading seconds field, but ${fields.length} were provided.`,
        expression,
      );
    }

    this.hasSecondsField = fields.length === 6;

    let index = 0;
    this.seconds = this.hasSecondsField
      ? this.parseField(fields[index++], 0, 59, "second", undefined, expression)
      : new Set([0]);
    this.minutes = this.parseField(fields[index++], 0, 59, "minute", undefined, expression);
    this.hours = this.parseField(fields[index++], 0, 23, "hour", undefined, expression);

    const dayOfMonthField = fields[index++];
    this.daysOfMonth = this.parseField(dayOfMonthField, 1, 31, "day-of-month", undefined, expression);

    this.months = this.parseField(fields[index++], 1, 12, "month", CronExpression.MONTH_NAMES, expression);

    const dayOfWeekField = fields[index++];
    this.daysOfWeek = this.parseDayOfWeek(dayOfWeekField, expression);

    this.dayOfMonthRestricted = dayOfMonthField !== "*";
    this.dayOfWeekRestricted = dayOfWeekField !== "*";
    this.expression = normalized;
  }

  /**
   * Returns whether an expression is valid without throwing — convenient for create-time
   * validation of user input where a boolean is more ergonomic than a try/catch.
   */
  public static isValid(expression: string): boolean {
    try {
      new CronExpression(expression);
      return true;
    } catch (error) {
      if (error instanceof InvalidCronExpressionError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Computes the next execution strictly after `from`.
   * @param from The reference instant. Defaults to now.
   * @returns The next matching `Date`, or `undefined` if the expression has no occurrence
   *   within the {@link CronExpression.MAX_SCAN_YEARS} scan window (i.e. it never matches,
   *   such as `0 0 30 2 *`).
   */
  public getNextExecutionDate(from: Date = new Date()): Date | undefined {
    if (!(from instanceof Date) || Number.isNaN(from.getTime())) {
      throw new TypeError("CronExpression.getNextExecutionDate expects a valid Date.");
    }

    // Round strictly up to the next unit boundary. Epoch arithmetic is used here (rather
    // than local-field arithmetic) so the rounding itself is immune to DST offsets; the
    // subsequent field-walk is done with local-time constructors so it is DST-aware.
    const unitMs = this.hasSecondsField ? 1000 : 60000;
    let candidate = new Date(Math.floor(from.getTime() / unitMs) * unitMs + unitMs);

    const maxYear = from.getFullYear() + CronExpression.MAX_SCAN_YEARS;

    for (let iterations = 0; iterations < CronExpression.MAX_SCAN_ITERATIONS; iterations++) {
      const year = candidate.getFullYear();
      if (year > maxYear) {
        return undefined;
      }

      // Each check that fails advances the smallest possible amount and resets every
      // lower-order field to its minimum, then restarts the loop. This converges in a
      // handful of iterations rather than scanning minute-by-minute.
      if (!this.months.has(candidate.getMonth() + 1)) {
        candidate = new Date(year, candidate.getMonth() + 1, 1, 0, 0, 0, 0);
        continue;
      }
      if (!this.matchesDay(candidate)) {
        candidate = new Date(year, candidate.getMonth(), candidate.getDate() + 1, 0, 0, 0, 0);
        continue;
      }
      if (!this.hours.has(candidate.getHours())) {
        candidate = new Date(year, candidate.getMonth(), candidate.getDate(), candidate.getHours() + 1, 0, 0, 0);
        continue;
      }
      if (!this.minutes.has(candidate.getMinutes())) {
        candidate = new Date(year, candidate.getMonth(), candidate.getDate(), candidate.getHours(), candidate.getMinutes() + 1, 0, 0);
        continue;
      }
      if (this.hasSecondsField && !this.seconds.has(candidate.getSeconds())) {
        candidate = new Date(year, candidate.getMonth(), candidate.getDate(), candidate.getHours(), candidate.getMinutes(), candidate.getSeconds() + 1, 0);
        continue;
      }

      return candidate;
    }

    return undefined;
  }

  /**
   * Computes up to `count` successive execution dates starting strictly after `from`.
   * Returns fewer than `count` (possibly zero) entries only if the expression stops
   * matching within the scan window.
   */
  public getNextExecutionDates(from: Date, count: number): Date[] {
    if (!Number.isInteger(count) || count < 0) {
      throw new TypeError("CronExpression.getNextExecutionDates expects a non-negative integer count.");
    }

    const dates: Date[] = [];
    let cursor = from;
    for (let i = 0; i < count; i++) {
      const next = this.getNextExecutionDate(cursor);
      if (next === undefined) {
        break;
      }
      dates.push(next);
      cursor = next;
    }
    return dates;
  }

  /** Returns the normalized expression. */
  public toString(): string {
    return this.expression;
  }

  /**
   * Applies the day-of-month / day-of-week OR rule for a candidate date.
   */
  private matchesDay(date: Date): boolean {
    const dayOfMonthMatches = this.daysOfMonth.has(date.getDate());
    const dayOfWeekMatches = this.daysOfWeek.has(date.getDay());

    if (this.dayOfMonthRestricted && this.dayOfWeekRestricted) {
      return dayOfMonthMatches || dayOfWeekMatches;
    }
    return dayOfMonthMatches && dayOfWeekMatches;
  }

  /**
   * Parses the day-of-week field, which is special-cased for the `0-7` range where both
   * `0` and `7` mean Sunday. Values are parsed against `0-7` and then `7` is normalized to
   * `0` so the resulting set aligns with `Date.getDay()`.
   */
  private parseDayOfWeek(field: string, original: string): ReadonlySet<number> {
    const raw = this.parseField(field, 0, 7, "day-of-week", CronExpression.DAY_OF_WEEK_NAMES, original);
    const normalized = new Set<number>();
    for (const value of raw) {
      normalized.add(value === 7 ? 0 : value);
    }
    return normalized;
  }

  /**
   * Parses a single cron field into the set of numeric values it allows.
   */
  private parseField(
    field: string,
    min: number,
    max: number,
    label: string,
    names: Readonly<Record<string, number>> | undefined,
    original: string,
  ): ReadonlySet<number> {
    const values = new Set<number>();

    for (const segment of field.split(",")) {
      if (segment.length === 0) {
        throw new InvalidCronExpressionError(
          `The ${label} field '${field}' contains an empty list element.`, original, label,
        );
      }

      // Split off an optional step (`.../n`).
      let rangePart = segment;
      let step = 1;
      const slashIndex = segment.indexOf("/");
      if (slashIndex !== -1) {
        rangePart = segment.slice(0, slashIndex);
        const stepPart = segment.slice(slashIndex + 1);
        if (stepPart.indexOf("/") !== -1) {
          throw new InvalidCronExpressionError(
            `The ${label} field element '${segment}' has more than one step.`, original, label,
          );
        }
        if (!/^\d+$/.test(stepPart)) {
          throw new InvalidCronExpressionError(
            `The ${label} field element '${segment}' has an invalid step '${stepPart}'.`, original, label,
          );
        }
        step = parseInt(stepPart, 10);
        if (step === 0) {
          throw new InvalidCronExpressionError(
            `The ${label} field element '${segment}' has a step of 0; the step must be greater than 0.`, original, label,
          );
        }
      }

      // Resolve the low/high bounds of this segment.
      let low: number;
      let high: number;
      if (rangePart === "*") {
        low = min;
        high = max;
      } else {
        const dashIndex = rangePart.indexOf("-");
        if (dashIndex > 0) {
          low = this.parseValue(rangePart.slice(0, dashIndex), min, max, label, names, original);
          high = this.parseValue(rangePart.slice(dashIndex + 1), min, max, label, names, original);
        } else {
          low = this.parseValue(rangePart, min, max, label, names, original);
          // `a/n` (a single value with a step) means "from a up to the maximum, every n".
          // A bare single value (`a`) is just that value.
          high = slashIndex !== -1 ? max : low;
        }
      }

      if (low > high) {
        throw new InvalidCronExpressionError(
          `The ${label} field element '${segment}' is a descending range (${low} > ${high}); ranges must be ascending.`,
          original, label,
        );
      }

      for (let value = low; value <= high; value += step) {
        values.add(value);
      }
    }

    return values;
  }

  /**
   * Parses one atomic token (a number or a name) and validates it is within range.
   */
  private parseValue(
    token: string,
    min: number,
    max: number,
    label: string,
    names: Readonly<Record<string, number>> | undefined,
    original: string,
  ): number {
    if (token.length === 0) {
      throw new InvalidCronExpressionError(`The ${label} field has a malformed, empty value.`, original, label);
    }

    let value: number;
    if (names !== undefined && /[a-zA-Z]/.test(token)) {
      const resolved = names[token.toUpperCase()];
      if (resolved === undefined) {
        throw new InvalidCronExpressionError(`The ${label} field has an unknown name '${token}'.`, original, label);
      }
      value = resolved;
    } else if (/^\d+$/.test(token)) {
      value = parseInt(token, 10);
    } else {
      throw new InvalidCronExpressionError(`The ${label} field has an invalid value '${token}'.`, original, label);
    }

    if (value < min || value > max) {
      throw new InvalidCronExpressionError(
        `The ${label} field value '${token}' is out of range (${min}-${max}).`, original, label,
      );
    }

    return value;
  }
}
