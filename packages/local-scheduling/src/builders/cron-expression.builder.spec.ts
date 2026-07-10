import "reflect-metadata";
import {CronExpressionBuilder} from "./cron-expression.builder";
import {CronExpression} from "../models/cron-expression.model";
import {CronSchedule} from "../schedules/cron.schedule";
import {MonthEnum} from "../enums/month.enum";
import {DayOfWeekEnum} from "../enums/day-of-week.enum";
import {InvalidCronExpressionError} from "../errors/invalid-cron-expression.error";

describe("CronExpressionBuilder", () => {
  it("defaults to every minute", () => {
    expect(new CronExpressionBuilder().toString()).toBe("* * * * *");
  });

  describe("field setters", () => {
    it("sets single and list values", () => {
      expect(new CronExpressionBuilder().atMinute(0).toString()).toBe("0 * * * *");
      expect(new CronExpressionBuilder().atMinute(0, 15, 30, 45).toString()).toBe("0,15,30,45 * * * *");
    });

    it("sets steps and ranges (with optional step)", () => {
      expect(new CronExpressionBuilder().everyMinutes(15).toString()).toBe("*/15 * * * *");
      expect(new CronExpressionBuilder().hoursBetween(9, 17).toString()).toBe("* 9-17 * * *");
      expect(new CronExpressionBuilder().hoursBetween(9, 17, 2).toString()).toBe("* 9-17/2 * * *");
    });

    it("sets day-of-month, month (MonthEnum) and day-of-week (DayOfWeekEnum)", () => {
      expect(new CronExpressionBuilder().onDayOfMonth(1, 15).toString()).toBe("* * 1,15 * *");
      expect(new CronExpressionBuilder().inMonth(MonthEnum.January, MonthEnum.July).toString()).toBe("* * * 1,7 *");
      expect(new CronExpressionBuilder().onDayOfWeek(DayOfWeekEnum.Monday, DayOfWeekEnum.Friday).toString()).toBe("* * * * 1,5");
    });

    it("adds a sixth seconds field when a second is set", () => {
      expect(new CronExpressionBuilder().atSecond(30).toString()).toBe("30 * * * * *");
      expect(new CronExpressionBuilder().everySeconds(10).dailyAt(3).toString()).toBe("*/10 0 3 * * *");
    });

    it("composes fields, last write wins per field", () => {
      const expr = new CronExpressionBuilder()
        .everyMinutes(15)
        .hoursBetween(9, 17)
        .onDayOfWeek(DayOfWeekEnum.Monday, DayOfWeekEnum.Tuesday, DayOfWeekEnum.Wednesday, DayOfWeekEnum.Thursday, DayOfWeekEnum.Friday)
        .toString();
      expect(expr).toBe("*/15 9-17 * * 1,2,3,4,5");
    });
  });

  describe("high-level helpers", () => {
    it("hourlyAtMinute / dailyAt / weeklyOn / monthlyOn", () => {
      expect(new CronExpressionBuilder().hourlyAtMinute(30).toString()).toBe("30 * * * *");
      expect(new CronExpressionBuilder().dailyAt(3).toString()).toBe("0 3 * * *");
      expect(new CronExpressionBuilder().dailyAt(3, 30).toString()).toBe("30 3 * * *");
      expect(new CronExpressionBuilder().weeklyOn(DayOfWeekEnum.Sunday, 2, 30).toString()).toBe("30 2 * * 0");
      expect(new CronExpressionBuilder().monthlyOn(1, 0).toString()).toBe("0 0 1 * *");
    });
  });

  describe("terminals", () => {
    it("build() returns a validated CronExpression that computes the next date", () => {
      const expression = new CronExpressionBuilder().dailyAt(3).build();
      expect(expression).toBeInstanceOf(CronExpression);
      expect(expression.expression).toBe("0 3 * * *");
      expect(expression.getNextExecutionDate(new Date(2027, 0, 1, 0, 0, 0))).toEqual(new Date(2027, 0, 1, 3, 0, 0));
    });

    it("toSchedule() returns a CronSchedule wrapping the same expression", () => {
      const schedule = new CronExpressionBuilder().dailyAt(3).toSchedule();
      expect(schedule).toBeInstanceOf(CronSchedule);
      expect(schedule.toString()).toBe("0 3 * * *");
    });

    it("build() throws on an out-of-range value", () => {
      expect(() => new CronExpressionBuilder().atMinute(99).build()).toThrow(InvalidCronExpressionError);
    });
  });
});
