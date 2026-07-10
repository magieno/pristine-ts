/**
 * Calendar months, numbered as cron's month field expects (1 = January … 12 = December). Use
 * with {@link CronExpressionBuilder.inMonth} for readable call sites instead of raw numbers.
 */
export enum MonthEnum {
  January = 1,
  February = 2,
  March = 3,
  April = 4,
  May = 5,
  June = 6,
  July = 7,
  August = 8,
  September = 9,
  October = 10,
  November = 11,
  December = 12,
}
