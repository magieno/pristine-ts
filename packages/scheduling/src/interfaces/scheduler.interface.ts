export interface SchedulerInterface {
    runTasks(): Promise<void>;
}