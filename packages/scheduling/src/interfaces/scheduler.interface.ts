/**
 * This interface defines what a Scheduler should implement.
 */
export interface SchedulerInterface {
    /**
     * This method runs all the tasks that were registered.
     */
    runTasks(): Promise<void>;
}
