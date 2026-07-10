import "reflect-metadata";
import {CronExpression} from "./cron-expression.model";
import {InvalidCronExpressionError} from "../errors/invalid-cron-expression.error";

/**
 * All assertions build their expected `Date`s with the local `Date` constructor and
 * compare `getTime()`, so the suite is independent of the machine's timezone.
 */
const at = (year: number, monthIndex: number, day: number, hours = 0, minutes = 0, seconds = 0): Date =>
  new Date(year, monthIndex, day, hours, minutes, seconds, 0);

describe("CronExpression - parsing & validation", () => {
  it("normalizes surrounding and repeated whitespace", () => {
    expect(new CronExpression("  */5   9-17  *    * 1-5 ").expression).toBe("*/5 9-17 * * 1-5");
    expect(new CronExpression("* * * * *").toString()).toBe("* * * * *");
  });

  it("accepts the 5-field form and the 6-field (seconds) form", () => {
    expect(new CronExpression("* * * * *").hasSecondsField).toBe(false);
    expect(new CronExpression("* * * * * *").hasSecondsField).toBe(true);
  });

  describe("invalid expressions throw a typed, field-aware error", () => {
    const cases: Array<[string, string | undefined]> = [
      ["", undefined],
      ["   ", undefined],
      ["* * * *", undefined],           // too few fields
      ["* * * * * * *", undefined],     // too many fields
      ["60 * * * *", "minute"],
      ["* 24 * * *", "hour"],
      ["* * 0 * *", "day-of-month"],    // dom min is 1
      ["* * 32 * *", "day-of-month"],
      ["* * * 0 *", "month"],
      ["* * * 13 *", "month"],
      ["* * * * 8", "day-of-week"],      // dow max is 7
      ["*/0 * * * *", "minute"],         // zero step
      ["5-1 * * * *", "minute"],         // descending range
      ["JAN * * * *", "minute"],         // names not allowed in the minute field
      ["* * * FOO *", "month"],          // unknown month name
      ["* * * * FUNDAY", "day-of-week"], // unknown day name
      ["1,,2 * * * *", "minute"],        // empty list element
      ["1//2 * * * *", "minute"],        // double step
      ["1- * * * *", "minute"],          // malformed range
    ];

    it.each(cases)("rejects %p", (expression, field) => {
      let thrown: unknown;
      try {
        new CronExpression(expression);
      } catch (error) {
        thrown = error;
      }
      expect(thrown).toBeInstanceOf(InvalidCronExpressionError);
      const error = thrown as InvalidCronExpressionError;
      expect(error.expression).toBe(expression);
      expect(typeof error.message).toBe("string");
      expect(error.message.length).toBeGreaterThan(0);
      // Surfaces as HTTP 400.
      expect(error.options.httpStatus).toBe(400);
      if (field !== undefined) {
        expect(error.field).toBe(field);
      }
    });
  });

  it("CronExpression.isValid mirrors the constructor without throwing", () => {
    expect(CronExpression.isValid("*/5 9-17 * * 1-5")).toBe(true);
    expect(CronExpression.isValid("0 0 29 2 *")).toBe(true); // valid, even if rare
    expect(CronExpression.isValid("60 * * * *")).toBe(false);
    expect(CronExpression.isValid("nonsense")).toBe(false);
  });
});

describe("CronExpression - getNextExecutionDate", () => {
  it("returns the next whole-minute occurrence, strictly after `from`", () => {
    const cron = new CronExpression("* * * * *");
    expect(cron.getNextExecutionDate(at(2027, 0, 1, 10, 0, 30))).toEqual(at(2027, 0, 1, 10, 1));
    // Exactly on a boundary still advances (strictly after).
    expect(cron.getNextExecutionDate(at(2027, 0, 1, 10, 0, 0))).toEqual(at(2027, 0, 1, 10, 1));
  });

  it("honours ranges", () => {
    const cron = new CronExpression("0 9-17 * * *");
    expect(cron.getNextExecutionDate(at(2027, 0, 1, 10, 30))).toEqual(at(2027, 0, 1, 11, 0));
    // After the range's end, rolls to the next day's start of range.
    expect(cron.getNextExecutionDate(at(2027, 0, 1, 18, 30))).toEqual(at(2027, 0, 2, 9, 0));
  });

  it("honours lists", () => {
    const cron = new CronExpression("0,30 * * * *");
    expect(cron.getNextExecutionDate(at(2027, 0, 1, 10, 15))).toEqual(at(2027, 0, 1, 10, 30));
    expect(cron.getNextExecutionDate(at(2027, 0, 1, 10, 45))).toEqual(at(2027, 0, 1, 11, 0));
  });

  it("honours '*/n' steps", () => {
    const cron = new CronExpression("*/15 * * * *");
    expect(cron.getNextExecutionDate(at(2027, 0, 1, 10, 7))).toEqual(at(2027, 0, 1, 10, 15));
    expect(cron.getNextExecutionDate(at(2027, 0, 1, 10, 59))).toEqual(at(2027, 0, 1, 11, 0));
  });

  it("honours 'a-b/n' and 'a/n' steps", () => {
    // a-b/n
    expect(new CronExpression("10-40/10 * * * *").getNextExecutionDates(at(2027, 0, 1, 10, 0), 4))
      .toEqual([at(2027, 0, 1, 10, 10), at(2027, 0, 1, 10, 20), at(2027, 0, 1, 10, 30), at(2027, 0, 1, 10, 40)]);
    // a/n means "from a to max, every n" -> 5,25,45
    expect(new CronExpression("5/20 * * * *").getNextExecutionDate(at(2027, 0, 1, 10, 6)))
      .toEqual(at(2027, 0, 1, 10, 25));
  });

  it("accepts case-insensitive month names", () => {
    expect(new CronExpression("0 0 1 JAN *").getNextExecutionDate(at(2027, 5, 1)))
      .toEqual(at(2028, 0, 1, 0, 0));
    expect(new CronExpression("0 0 1 jan *").getNextExecutionDate(at(2027, 5, 1)))
      .toEqual(at(2028, 0, 1, 0, 0));
  });

  it("treats both 0 and 7 as Sunday", () => {
    const from = at(2027, 0, 1, 12, 0); // 2027-01-01 is a Friday
    const withZero = new CronExpression("0 0 * * 0").getNextExecutionDate(from);
    const withSeven = new CronExpression("0 0 * * 7").getNextExecutionDate(from);
    const withName = new CronExpression("0 0 * * SUN").getNextExecutionDate(from);
    expect(withZero).toEqual(withSeven);
    expect(withZero).toEqual(withName);
    expect(withZero!.getDay()).toBe(0);
  });

  it("supports day-of-week name ranges (weekdays)", () => {
    const cron = new CronExpression("0 0 * * MON-FRI");
    const dates = cron.getNextExecutionDates(at(2027, 0, 1, 12, 0), 5);
    expect(dates).toHaveLength(5);
    for (const date of dates) {
      expect(date.getDay()).toBeGreaterThanOrEqual(1);
      expect(date.getDay()).toBeLessThanOrEqual(5);
    }
  });
});

describe("CronExpression - day-of-month / day-of-week OR rule", () => {
  it("ORs the two fields when BOTH are restricted", () => {
    // 13th of the month OR any Friday.
    const cron = new CronExpression("0 0 13 * 5");
    const dates = cron.getNextExecutionDates(at(2027, 0, 1, 12, 0), 12);
    expect(dates.length).toBe(12);
    for (const date of dates) {
      expect(date.getDate() === 13 || date.getDay() === 5).toBe(true);
    }
    // It must include at least one 13th that is not a Friday, and at least one Friday
    // that is not the 13th — proving OR (not AND).
    expect(dates.some((d) => d.getDate() === 13 && d.getDay() !== 5)).toBe(true);
    expect(dates.some((d) => d.getDay() === 5 && d.getDate() !== 13)).toBe(true);
  });

  it("ANDs (only the restricted field matters) when day-of-week is '*'", () => {
    const cron = new CronExpression("0 0 13 * *");
    for (const date of cron.getNextExecutionDates(at(2027, 0, 1), 6)) {
      expect(date.getDate()).toBe(13);
    }
  });

  it("ANDs (only the restricted field matters) when day-of-month is '*'", () => {
    const cron = new CronExpression("0 0 * * 5");
    for (const date of cron.getNextExecutionDates(at(2027, 0, 1), 6)) {
      expect(date.getDay()).toBe(5);
    }
  });

  it("matches the classic '30 4 1,15 * 5' example", () => {
    const cron = new CronExpression("30 4 1,15 * 5");
    for (const date of cron.getNextExecutionDates(at(2027, 0, 1), 10)) {
      expect(date.getHours()).toBe(4);
      expect(date.getMinutes()).toBe(30);
      expect(date.getDate() === 1 || date.getDate() === 15 || date.getDay() === 5).toBe(true);
    }
  });
});

describe("CronExpression - month lengths & leap years", () => {
  it("skips months that do not have a 31st", () => {
    const cron = new CronExpression("0 0 31 * *");
    const months = cron.getNextExecutionDates(at(2027, 0, 1), 7).map((d) => d.getMonth());
    // Jan(0), Mar(2), May(4), Jul(6), Aug(7), Oct(9), Dec(11) -- never Feb/Apr/Jun/Sep/Nov.
    expect(months).toEqual([0, 2, 4, 6, 7, 9, 11]);
  });

  it("finds the next Feb 29 across the leap-year gap", () => {
    // 2028 is the next leap year after 2025/2026/2027.
    expect(new CronExpression("0 0 29 2 *").getNextExecutionDate(at(2025, 5, 1)))
      .toEqual(at(2028, 1, 29, 0, 0));
    expect(new CronExpression("0 0 29 2 *").getNextExecutionDate(at(2027, 0, 1)))
      .toEqual(at(2028, 1, 29, 0, 0));
  });

  it("returns undefined for expressions that can never match (scan guard)", () => {
    expect(new CronExpression("0 0 30 2 *").getNextExecutionDate(at(2027, 0, 1))).toBeUndefined();
    expect(new CronExpression("0 0 31 4 *").getNextExecutionDate(at(2027, 0, 1))).toBeUndefined(); // April has 30 days
    expect(new CronExpression("0 0 31 2 *").getNextExecutionDate(at(2027, 0, 1))).toBeUndefined();
  });
});

describe("CronExpression - 6-field (seconds)", () => {
  it("computes second-level occurrences", () => {
    const cron = new CronExpression("*/30 * * * * *");
    expect(cron.getNextExecutionDate(at(2027, 0, 1, 10, 0, 10))).toEqual(at(2027, 0, 1, 10, 0, 30));
    expect(cron.getNextExecutionDate(at(2027, 0, 1, 10, 0, 45))).toEqual(at(2027, 0, 1, 10, 1, 0));
  });

  it("honours a fixed seconds value", () => {
    const cron = new CronExpression("15 30 9 * * *");
    expect(cron.getNextExecutionDate(at(2027, 0, 1, 0, 0, 0))).toEqual(at(2027, 0, 1, 9, 30, 15));
  });
});

describe("CronExpression - getNextExecutionDates", () => {
  it("returns `count` strictly increasing dates", () => {
    const cron = new CronExpression("*/15 * * * *");
    const dates = cron.getNextExecutionDates(at(2027, 0, 1, 10, 0), 5);
    expect(dates).toHaveLength(5);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i].getTime()).toBeGreaterThan(dates[i - 1].getTime());
    }
  });

  it("returns an empty array for count 0 or for never-matching expressions", () => {
    expect(new CronExpression("* * * * *").getNextExecutionDates(at(2027, 0, 1), 0)).toEqual([]);
    expect(new CronExpression("0 0 30 2 *").getNextExecutionDates(at(2027, 0, 1), 5)).toEqual([]);
  });

  it("rejects a negative or non-integer count", () => {
    const cron = new CronExpression("* * * * *");
    expect(() => cron.getNextExecutionDates(at(2027, 0, 1), -1)).toThrow(TypeError);
    expect(() => cron.getNextExecutionDates(at(2027, 0, 1), 1.5)).toThrow(TypeError);
  });

  it("rejects an invalid `from` for getNextExecutionDate", () => {
    const cron = new CronExpression("* * * * *");
    expect(() => cron.getNextExecutionDate(new Date(NaN))).toThrow(TypeError);
  });
});
