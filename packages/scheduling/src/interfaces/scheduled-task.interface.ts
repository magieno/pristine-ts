/**
 * This interface defines what a Scheduled task should implement.
 */
export interface ScheduledTaskInterface {
  /**
   * This method runs the actual task.
   */
  run(eventId?: string): Promise<void>;
}
