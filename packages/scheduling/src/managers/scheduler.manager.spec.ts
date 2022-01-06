import "reflect-metadata"
import {SchedulerManager} from "./scheduler.manager";
import {ScheduledTaskInterface} from "../interfaces/scheduled-task.interface";
import {Event} from "@pristine-ts/core";
import {LogHandlerInterface} from "@pristine-ts/logging";

describe("Scheduler Manager tests", () => {
    const logHandlerMock: LogHandlerInterface = {
        debug(message: string, extra?: any) {
        },
        info(message: string, extra?: any) {
        },
        error(message: string, extra?: any) {
        }
        ,critical(message: string, extra?: any) {
        },
        warning(message: string, extra?: any) {
        },
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
