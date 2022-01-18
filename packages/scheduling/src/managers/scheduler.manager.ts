import {injectable, injectAll, inject} from "tsyringe";
import {ScheduledTaskInterface} from "../interfaces/scheduled-task.interface";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {SchedulingModuleKeyname} from "../scheduling.module.keyname";
import {SchedulerInterface} from "../interfaces/scheduler.interface";
import {LogHandlerInterface} from "@pristine-ts/logging";

/**
 * The Scheduler Manager runs the scheduled tasks.
 * It is tagged so it can be injected using SchedulerInterface.
 * It is module scoped to the scheduling module.
 */
@moduleScoped(SchedulingModuleKeyname)
@tag("SchedulerInterface")
@injectable()
export class SchedulerManager implements SchedulerInterface {

    /**
     * The Scheduler Manager runs the scheduled tasks.
     * @param scheduledTasks The scheduled tasks to run. All services with the tag ServiceDefinitionTagEnum.ScheduledTask will be automatically injected here.
     * @param logHandler The log handler to use to output logs.
     */
    constructor(@injectAll(ServiceDefinitionTagEnum.ScheduledTask) private readonly scheduledTasks: ScheduledTaskInterface[],
                @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {
    }

    /**
     * This method runs all the tasks that were registered.
     */
    async runTasks(): Promise<void> {
        this.logHandler.debug("Starting the execution of the tasks.", {scheduledTasks: this.scheduledTasks}, SchedulingModuleKeyname);

        return new Promise(resolve => {
            const promises: Promise<void>[] = [];

            this.scheduledTasks.forEach(scheduledTask => {
                promises.push(scheduledTask.run());
            });

            this.logHandler.debug("Completed triggering all the tasks.", {scheduledTasks: this.scheduledTasks}, SchedulingModuleKeyname);

            Promise.allSettled(promises).then(results => {
                results.forEach(result => {
                    if(result.status === 'fulfilled') {
                        this.logHandler.debug("Scheduled Task Fulfilled", {result}, SchedulingModuleKeyname)
                    }
                    else {
                        this.logHandler.error("Scheduled Task Error", {
                            result: {
                                status: result.status,
                                reason: result.reason + "",
                            }
                        }, SchedulingModuleKeyname)
                    }
                });

                return resolve();
            });
        })
    }
}
