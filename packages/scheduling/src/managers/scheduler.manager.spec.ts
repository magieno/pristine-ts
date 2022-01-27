import "reflect-metadata"
import {SchedulerManager} from "./scheduler.manager";
import {ScheduledTaskInterface} from "../interfaces/scheduled-task.interface";
import {Event} from "@pristine-ts/core";
import {LogHandlerInterface} from "@pristine-ts/logging";

describe("Scheduler Manager tests", () => {
    const logHandlerMock: LogHandlerInterface = {
        critical(message: string, extra?: any): void {
        }, debug(message: string, extra?: any): void {
        }, error(message: string, extra?: any): void {
        }, info(message: string, extra?: any): void {
        }, warning(message: string, extra?: any): void {
        }, terminate() {
        }
    }

    it("should call the scheduled task", async () => {
        const scheduledTask: ScheduledTaskInterface = {
            async run(): Promise<void> {
            }
        };

        const spy = jest.spyOn(scheduledTask, "run");

        const schedulerManager = new SchedulerManager([
            scheduledTask,
        ], logHandlerMock);

        await schedulerManager.runTasks();

        expect(spy).toHaveBeenCalled();
    })
})
