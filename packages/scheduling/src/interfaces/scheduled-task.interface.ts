export interface ScheduledTaskInterface {
    run(): Promise<void>;
}
