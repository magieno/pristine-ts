/**
 * The DI tag under which {@link CronScheduledTaskInterface} implementations are registered
 * and discovered. Apply it to a task class with the framework's `@tag(CronScheduledTaskTag)`
 * decorator; `LocalSchedulerManager` injects the tagged collection with the same token.
 */
export const CronScheduledTaskTag: string = "CronScheduledTaskInterface";
