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

### Static: a task that declares its schedule

A `SchedulableInterface` is a `ScheduledTaskInterface` (from `@pristine-ts/scheduling`) that
*additionally* declares *when* it should run. Keeping it a separate interface makes it
explicit that a driver must be present to honour the schedule. Tag the class with
`@tag(ServiceDefinitionTagEnum.Schedulable)`; every tagged class is discovered and
**auto-registered on `start()`**.

```typescript
import "reflect-metadata";
import {injectable} from "tsyringe";
import {injectConfig, tag, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {
  SchedulableInterface, ScheduleInterface, CronSchedule,
} from "@pristine-ts/local-scheduling";

@tag(ServiceDefinitionTagEnum.Schedulable)
@injectable()
export class NightlyCleanupTask implements SchedulableInterface {
  // Config is injected as a resolved value by its key (registered in a module's
  // `configurationDefinitions`). Because getSchedules() is a method, the schedule can be
  // computed from any injected dependency — a config value, a repository, etc.
  constructor(@injectConfig("app.cleanup.cron") private readonly cleanupCron: string) {}

  getSchedules(): ScheduleInterface[] {
    return [new CronSchedule(this.cleanupCron)];
  }

  async run(eventId?: string): Promise<void> {
    // ...the work. `eventId` correlates logs to the specific occurrence.
  }
}
```

A tagged task is registered under an id derived from its **class name** (suffixed `#0`, `#1`,
… when it declares more than one schedule). Names are used as-is, so keep them distinct and,
if you minify server code, preserve class names — or use the dynamic API below, where ids are
explicit. A tagged task whose id is already taken, or whose `getSchedules()` throws, is logged
and skipped — it never prevents the others, or the scheduler, from starting. Static tasks run
with the default policies; for per-schedule policies (overlap, catch-up) use the dynamic API.

### Dynamic: schedules as runtime state

Resolve `LocalSchedulerManager`, register schedules (typically from a database at bootstrap),
then `start()`:

```typescript
import {Kernel} from "@pristine-ts/core";
import {LocalSchedulerManager} from "@pristine-ts/local-scheduling";

const kernel = new Kernel();
await kernel.start(AppModule);
const scheduler = kernel.container.resolve(LocalSchedulerManager);

for (const s of await scheduleRepository.findAll()) {
  scheduler.schedule(
    `routine:${s.routineId}:${s.id}`,
    s.cronExpression,                // a cron string is shorthand for a CronSchedule
    (eventId) => routineExecutionManager.execute(s.routineId, eventId),
  );
}

scheduler.start();
```

Mutate schedules at runtime — for example from an HTTP controller:

```typescript
scheduler.reschedule(`routine:${routineId}:${scheduleId}`, "*/10 * * * *");
scheduler.unschedule(`routine:${routineId}:${scheduleId}`);
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
