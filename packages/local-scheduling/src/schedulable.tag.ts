/**
 * The DI tag under which {@link SchedulableInterface} implementations are registered and
 * discovered. Apply it to a task class with the framework's `@tag(SchedulableTag)` decorator;
 * {@link LocalSchedulerManager} injects the tagged collection with the same token and arms
 * each task's schedules on `start()`.
 */
export const SchedulableTag: string = "SchedulableInterface";
