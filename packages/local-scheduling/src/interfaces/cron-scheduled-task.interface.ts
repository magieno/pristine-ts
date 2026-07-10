import {ScheduledTaskInvocationContext} from "./scheduled-task-invocation-context.interface";
import {CronScheduledTaskConfiguration} from "./cron-scheduled-task-configuration.interface";

/**
 * A class-based scheduled task that the scheduler discovers and arms automatically.
 *
 * Tag the implementing class with `@tag(CronScheduledTaskTag)` (and `@injectable()`) so it
 * is registered for discovery; `LocalSchedulerManager` injects every such class and, on
 * `start()`, registers each one from the configuration it returns.
 *
 * Because the configuration comes from a method (not a decorator argument), a task may
 * compute its schedule from injected dependencies:
 *
 * ```ts
 * @tag(CronScheduledTaskTag)
 * @injectable()
 * export class NightlyCleanupTask implements CronScheduledTaskInterface {
 *   constructor(@inject("MyConfig") private readonly config: MyConfig) {}
 *
 *   getScheduleConfiguration(): CronScheduledTaskConfiguration {
 *     return { id: "cleanup:nightly", cronExpression: this.config.cleanupCron, options: { catchUp: true } };
 *   }
 *
 *   async run(context: ScheduledTaskInvocationContext): Promise<void> {
 *     // ...
 *   }
 * }
 * ```
 */
export interface CronScheduledTaskInterface {
  /**
   * Declares the schedule for this task. Called once when the scheduler starts. Any error
   * thrown here is logged and isolates this task — it does not prevent other tasks or the
   * scheduler from starting.
   */
  getScheduleConfiguration(): CronScheduledTaskConfiguration;

  /** The work run on each fire, receiving the same context as a dynamic task. */
  run(context: ScheduledTaskInvocationContext): void | Promise<void>;
}
