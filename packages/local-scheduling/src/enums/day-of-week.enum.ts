/**
 * Days of the week, numbered as cron's day-of-week field expects (0 = Sunday … 6 = Saturday;
 * cron also accepts 7 for Sunday). Use with {@link CronExpressionBuilder.onDayOfWeek} for
 * readable call sites instead of raw numbers.
 */
export enum DayOfWeekEnum {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}
