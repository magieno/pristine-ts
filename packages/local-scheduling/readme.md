# @pristine-ts/local-scheduling

In-process scheduling for long-running Pristine applications.

`@pristine-ts/scheduling` is deliberately trigger-agnostic — a `ScheduledTaskInterface` is
just work (`run()`), and *something external* decides when it runs: `SchedulerManager.runTasks()`
is fired by AWS EventBridge (via `@pristine-ts/aws-scheduling`), an HTTP request, or a manual
call. That model is perfect for a serverless function invoked on a cron rule.

This module solves the other case: an **always-up Node process** (an HTTP server, a worker)
that must run tasks on their own schedules from *inside* the process, with **no external
trigger**. It owns the clock: it reads each task's declared schedule and arms an in-process
timer for it. Schedules are polymorphic (a recurring cron, a one-off date, ...) and can also
be created, edited, and deleted at runtime — which suits a consumer that loads user-defined
schedules from a database and mutates them from HTTP controllers.

It is platform-neutral (nothing AWS-specific) and has **zero third-party runtime
dependencies** — the cron engine is written in-house. It builds on `@pristine-ts/scheduling`
(a schedulable task *is* a scheduled task, see below) and coexists with
`@pristine-ts/aws-scheduling` and the other drivers; none of them interfere.

## Installation

```bash
npm install @pristine-ts/local-scheduling
```

Import the module into your application module:

```typescript
import {AppModuleInterface} from "@pristine-ts/common";
import {LocalSchedulingModule} from "@pristine-ts/local-scheduling";

export const AppModule: AppModuleInterface = {
  keyname: "app",
  importModules: [
    LocalSchedulingModule,
    // ...
  ],
  providerRegistrations: [],
};
```

## Two ways to schedule

A driver — not the task — decides when a task runs. This module is that driver for an
in-process daemon, and it sources schedules two ways that share one id space and one set of
timers:

1. **Statically**, from tasks that declare their own schedule (`SchedulableInterface`),
   auto-registered when the scheduler starts.
2. **Dynamically**, through `LocalSchedulerManager`'s runtime API (typically fed from a
   database at bootstrap and mutated by HTTP controllers).

You do not start the scheduler yourself: the module registers a `LocalSchedulerRuntimeServer`
(a `RuntimeServerInterface`), so **`pristine start` starts it — arming every tagged task — and
stops it on shutdown**, alongside your HTTP/gRPC servers. Under the hood it does two steps —
`SchedulableTaskManager.register()` (discover the tagged tasks and register them) then the
scheduler's `start()`. Both are injectable, so **any other entry point — a custom command, an
embedded bootstrap — can run the same two steps**. Resolve `LocalSchedulerManager` only when you
need the dynamic API; call `start()` / `stop()` by hand only if you embed the kernel yourself
instead of using `pristine start`.

### Static: a task that declares its schedule

A `SchedulableInterface` is a `ScheduledTaskInterface` (from `@pristine-ts/scheduling`) that
*additionally* declares *when* it should run. Keeping it a separate interface makes it
explicit that a driver must be present to honour the schedule. Tag the class with
`@tag(ServiceDefinitionTagEnum.Schedulable)`; `SchedulableTaskManager` discovers every tagged
class and registers it when the scheduler starts (automatically under `pristine start`).

```typescript
import "reflect-metadata";
import {injectable} from "tsyringe";
import {injectConfig, tag, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {
  SchedulableInterface, ScheduleInterface, CronSchedule,
} from "@pristine-ts/local-scheduling";

// Typed configuration keys for your app, mirroring each package's `XxxConfigurationKeys`
// (e.g. `JwtConfigurationKeys`) — a const object, not a magic string at the call site.
export const AppConfigurationKeys = {
  CleanupCron: "app.cleanup.cron",
} as const;

@tag(ServiceDefinitionTagEnum.Schedulable)
@injectable()
export class NightlyCleanupTask implements SchedulableInterface {
  // Because getSchedules() is a method, the schedule can be computed from any injected
  // dependency — here a configuration value resolved by its key.
  constructor(@injectConfig(AppConfigurationKeys.CleanupCron) private readonly cleanupCron: string) {}

  getSchedules(): ScheduleInterface[] {
    return [new CronSchedule(this.cleanupCron)];
  }

  async run(eventId?: string): Promise<void> {
    // ...the work. `eventId` correlates logs to the specific occurrence.
  }
}
```

The key is declared in your application module's `configurationDefinitions`, so the
configuration system resolves it (from an environment variable, a default, etc.) — the same
way `@pristine-ts/jwt` declares its own keys:

```typescript
import {EnvironmentVariableResolver} from "@pristine-ts/configuration";

// in your AppModule:
configurationDefinitions: [
  {
    parameterName: AppConfigurationKeys.CleanupCron,
    isRequired: false,
    defaultValue: "0 3 * * *",
    defaultResolvers: [new EnvironmentVariableResolver("APP_CLEANUP_CRON")],
  },
],
```

A tagged task is registered under an id derived from its **class name** (suffixed `#0`, `#1`,
… when it declares more than one schedule). Names are used as-is, so keep them distinct and,
if you minify server code, preserve class names — or use the dynamic API below, where ids are
explicit. A tagged task whose id is already taken, or whose `getSchedules()` throws, is logged
and skipped — it never prevents the others, or the scheduler, from starting. Static tasks run
with the default policies; for per-schedule policies (overlap, catch-up) use the dynamic API.

### Dynamic: schedules as runtime state

Inject `LocalSchedulerManager` (by class, or by the `"LocalSchedulerInterface"` token) wherever
you load or mutate schedules — a service that reads them from a database at bootstrap, an HTTP
controller that edits them. There is no manual `start()`: `schedule()` arms immediately when the
scheduler is already running (it is, under `pristine start`), otherwise on start.

```typescript
import {injectable, inject} from "tsyringe";
import {LocalSchedulerInterface} from "@pristine-ts/local-scheduling";

@injectable()
export class RoutineScheduler {
  constructor(
    @inject("LocalSchedulerInterface") private readonly scheduler: LocalSchedulerInterface,
    @inject("RoutineRunnerInterface") private readonly runner: RoutineRunnerInterface,
  ) {}

  // Register a schedule loaded from your database.
  register(routineId: string, scheduleId: string, cronExpression: string): void {
    this.scheduler.schedule(
      `routine:${routineId}:${scheduleId}`,
      cronExpression,                 // a cron string is shorthand for a CronSchedule
      (eventId) => this.runner.execute(routineId, eventId),
    );
  }

  // Edit or remove them at runtime — e.g. from an HTTP controller.
  reschedule(routineId: string, scheduleId: string, cronExpression: string): void {
    this.scheduler.reschedule(`routine:${routineId}:${scheduleId}`, cronExpression);
  }

  unregister(routineId: string, scheduleId: string): void {
    this.scheduler.unschedule(`routine:${routineId}:${scheduleId}`);
  }
}
```

## Schedules

A schedule answers one question — *when does this next run?* — and is polymorphic, so the
scheduler drives any kind through the same contract (`ScheduleInterface`):

| Schedule | When it fires |
|---|---|
| `new CronSchedule("0 3 * * *")` | Recurring, on a cron expression (string or a `CronExpression`). |
| `new DateSchedule(new Date("2026-12-31T23:59:00"))` | Once, at a fixed instant; afterwards it is left unarmed. |

Both are accepted anywhere a schedule is expected (`schedule()`, `reschedule()`, a task's
`getSchedules()`), and a plain cron **string** is accepted as shorthand for a `CronSchedule`.
New schedule kinds only need to implement `ScheduleInterface` — the scheduler needs no change.

## Building expressions

Prefer not to hand-write cron? `CronExpressionBuilder` composes an expression from typed,
self-describing calls — each sets one field, and a fresh builder is already "every minute":

```typescript
import {CronExpressionBuilder, MonthEnum, DayOfWeekEnum} from "@pristine-ts/local-scheduling";

new CronExpressionBuilder().dailyAt(3).toString();                            // "0 3 * * *"
new CronExpressionBuilder().weeklyOn(DayOfWeekEnum.Sunday, 2, 30).toString(); // "30 2 * * 0"

const schedule = new CronExpressionBuilder()   // every 15 min, 09:00-17:00, Mon-Fri
  .everyMinutes(15)
  .hoursBetween(9, 17)
  .daysOfWeekBetween(DayOfWeekEnum.Monday, DayOfWeekEnum.Friday)
  .toSchedule();                               // -> CronSchedule, ready for schedule()/getSchedules()
```

- **Per-field setters** — `atMinute(...)` / `atHour(...)` / `onDayOfMonth(...)` / `inMonth(...)` /
  `onDayOfWeek(...)` (variadic lists), `everyMinutes(n)` / `everyHours(n)` / … (steps), and
  `minutesBetween(a, b, step?)` / `hoursBetween(a, b, step?)` / … (ranges). `atSecond(...)` /
  `everySeconds(n)` add the optional sixth seconds field.
- **High-level helpers** — `hourlyAtMinute(m)`, `dailyAt(hour, minute?)`,
  `weeklyOn(dayOfWeek, hour, minute?)`, `monthlyOn(dayOfMonth, hour, minute?)`.
- **Terminals** — `toString()` (the raw string), `build()` (a validated `CronExpression`, which
  throws `InvalidCronExpressionError` on an out-of-range value), and `toSchedule()` (a
  `CronSchedule`).
- `MonthEnum` and `DayOfWeekEnum` are exported so `inMonth(MonthEnum.January)` and
  `onDayOfWeek(DayOfWeekEnum.Monday)` read intent instead of raw numbers.

## `LocalSchedulerManager`

Injectable, module-scoped, and tagged `"LocalSchedulerInterface"` (inject by class or by that
token). It is a **process-wide singleton**, so the code that starts it at bootstrap and the
controllers that mutate schedules at runtime share the same instance and timers.

| Method | Description |
|---|---|
| `schedule(id, schedule, task, options?)` | Register a task. `schedule` is a `ScheduleInterface` or a cron string. Arms immediately if already started, otherwise on `start()`. Throws `ScheduleAlreadyExistsError` on a duplicate id, `InvalidCronExpressionError` on a bad cron string. |
| `unschedule(id)` | Cancel and remove a schedule. Returns `true` if one was removed. |
| `reschedule(id, schedule)` | Replace a schedule (task and options preserved). Throws `ScheduleNotFoundError` if absent. |
| `has(id)` | Whether a schedule is registered. |
| `list()` | A snapshot (`ScheduleDescriptor[]`) of every schedule, with its `schedule`, next execution date, and running state. |
| `getNextExecutionDate(id)` | The next armed date for a schedule. |
| `start()` | Register tagged tasks, then arm every schedule. Idempotent. |
| `stop()` | Cancel every timer synchronously (no fire happens after `stop()` returns) and resolve once in-flight tasks have settled — `await` it for a graceful shutdown. |
| `isStarted` | Whether the scheduler is started. |

The `task` receives the `eventId` the scheduler generates for each occurrence
(`"<id>:<scheduled-ISO-date>"`), mirroring `ScheduledTaskInterface.run`. A plain
`() => Promise<void>` is assignable too, so the argument is optional to consume.

### Per-schedule options

```typescript
scheduler.schedule("report", "0 * * * *", task, {
  allowOverlap: false,  // default: skip a fire if the previous invocation is still running
  catchUp: false,       // default: skip occurrences missed while asleep/stalled
  missedExecutionThresholdInMilliseconds: 5000, // how late counts as "missed"
});
```

- **Overlap** — by default a schedule never runs concurrently with itself: if it fires while
  the previous invocation is still running, that fire is skipped (and logged). Set
  `allowOverlap: true` to run anyway.
- **Missed fires** — if the host sleeps or the event loop stalls past an occurrence, the
  default is to skip the missed occurrence and arm for the next future one. Set
  `catchUp: true` to fire **at most one** catch-up on wake (multiple missed occurrences still
  collapse into one).
- **Task errors** — a task that throws or rejects is caught and logged via the `LogHandler`;
  the scheduling loop is never broken.

### Timer strategy

Each schedule owns a single chained `setTimeout`, re-armed from `Date.now()` after every fire
(so it never drifts) and **chunked** past the `2^31-1` ms (~24.8 day) ceiling. Re-arming
happens *before* the task runs, so a long task never delays subsequent occurrences.

## `CronExpression`

Parses and validates a standard **5-field** cron expression (with an optional leading **6th
seconds field**) and computes upcoming dates. `CronSchedule` wraps it; you can also use it
directly to preview runs or validate user input before persisting it:

```typescript
import {CronExpression} from "@pristine-ts/local-scheduling";

new CronExpression("*/5 9-17 * * 1-5").getNextExecutionDates(new Date(), 3);

CronExpression.isValid(userInput); // -> boolean, no try/catch
```

```
┌───────────── second (0-59)      (optional 6th field)
│ ┌─────────── minute (0-59)
│ │ ┌───────── hour (0-23)
│ │ │ ┌─────── day-of-month (1-31)
│ │ │ │ ┌───── month (1-12 or JAN-DEC)
│ │ │ │ │ ┌─── day-of-week (0-7 or SUN-SAT; 0 and 7 are both Sunday)
* * * * * *
```

- Each field supports `*`, single values, ranges (`a-b`), lists (`a,b,c`), and steps (`*/n`,
  `a-b/n`, `a/n`). Month and day-of-week accept case-insensitive names.
- Ranges must be ascending; write wrap-arounds as lists (`FRI,SAT,SUN`).
- **Day-of-month / day-of-week OR rule:** when both are restricted (neither is `*`), the
  expression matches when *either* matches — e.g. `30 4 1,15 * 5` runs at 04:30 on the 1st and
  15th **and** every Friday.

| Member | Description |
|---|---|
| `new CronExpression(expr)` | Parse/validate. Throws `InvalidCronExpressionError` (HTTP 400) on bad input. |
| `getNextExecutionDate(from?)` | Next occurrence strictly after `from` (default now), or `undefined` if it never occurs (e.g. `0 0 30 2 *`). |
| `getNextExecutionDates(from, count)` | Up to `count` successive occurrences. |
| `CronExpression.isValid(expr)` | Boolean validity check (no throw). |

### Time semantics

All computations use the host's **system local time**. Across a spring-forward DST transition
a non-existent local time is skipped; across a fall-back transition a repeated local time
fires once. The API is shaped so an IANA timezone can be added later as an optional argument
without changing existing signatures.

## Errors

All extend the framework's `PristineError`, so they surface with the right HTTP status if they
reach a controller boundary:

- `InvalidCronExpressionError` — **400**; carries the offending `expression` and `field`.
- `ScheduleNotFoundError` — **404**.
- `ScheduleAlreadyExistsError` — **409**.
