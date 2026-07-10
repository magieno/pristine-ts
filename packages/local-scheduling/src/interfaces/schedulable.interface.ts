import {ScheduledTaskInterface} from "@pristine-ts/scheduling";
import {ScheduleInterface} from "./schedule.interface";

/**
 * A {@link ScheduledTaskInterface} that additionally declares *when* it should run, so a
 * scheduler driver can execute it automatically.
 *
 * A scheduled task is just work — `run()` — and, by design in `@pristine-ts/scheduling`,
 * something external decides when it runs (AWS EventBridge, an HTTP trigger, a manual call).
 * Implementing `SchedulableInterface` is how a task carries its own schedule so an in-process
 * driver ({@link LocalSchedulerManager}) can own the clock and run it with no external
 * trigger. Keeping this a separate interface — rather than adding a schedule to every
 * scheduled task — makes it explicit that a driver must be present to honour the schedule.
 *
 * Tag the implementing class with `@tag(SchedulableTag)` (and `@injectable()`); the local
 * scheduler injects every tagged class and, on `start()`, arms one timer per schedule the
 * task returns.
 *
 * ```ts
 * @tag(SchedulableTag)
 * @injectable()
 * export class NightlyCleanupTask implements SchedulableInterface {
 *   constructor(@inject("MyConfig") private readonly config: MyConfig) {}
 *
 *   getSchedules(): ScheduleInterface[] {
 *     return [new CronSchedule(this.config.cleanupCron)];
 *   }
 *
 *   async run(eventId?: string): Promise<void> {
 *     // ...
 *   }
 * }
 * ```
 */
export interface SchedulableInterface extends ScheduledTaskInterface {
  /**
   * The schedule(s) on which this task runs. Called once when the scheduler starts, so the
   * task may compute them from injected dependencies. Return more than one to run the same
   * task on several schedules (for example a recurring cron plus a one-off date), mixing
   * schedule kinds freely. Any error thrown here isolates this task — it is logged and does
   * not prevent other tasks, or the scheduler, from starting.
   */
  getSchedules(): ScheduleInterface[];
}
