import "reflect-metadata"
import {SchedulerManager} from "./scheduler.manager";
import {ScheduledTaskInterface} from "../interfaces/scheduled-task.interface";
import {Event} from "@pristine-ts/event";

describe("Scheduler Manager tests", () => {
    it("should call the scheduled task", async () => {
        const scheduledTask: ScheduledTaskInterface = {
            async run(): Promise<void> {

            }
        };

        const spy = jest.spyOn(scheduledTask, "run");

        const schedulerManager = new SchedulerManager([
            scheduledTask,
        ]);

        const event = new Event();
        await schedulerManager.handle(event);

        expect(spy).toHaveBeenCalled();
    })
})