import {injectable, injectAll, inject} from "tsyringe";
import {ScheduledTaskInterface} from "../interfaces/scheduled-task.interface";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {SchedulingModuleKeyname} from "../scheduling.module.keyname";
import {SchedulerInterface} from "../interfaces/scheduler.interface";
import {LogHandlerInterface} from "@pristine-ts/logging";

/**
 * The Scheduler Manager runs the scheduled tasks.A scheduled task cannot specify the interval at which it wants to be triggered.
 * It's only a mechanism to understand that must be triggered by a CRON.
 * When used with a CRON, a scheduled task will be triggered at a recurring interval, it is your own responsibility to implement a
 * logic of executing or not based on how long it's been since the last execution.
 * Please look at the aws-scheduling module for an example of how to setup a CRON using AWS Event Bridge with Pristine's listeners.
 * It is tagged so it can be injected using SchedulerInterface.
 * It is module scoped to the scheduling module.
 */
@moduleScoped(SchedulingModuleKeyname)
@tag("SchedulerInterface")
@injectable()
export class SchedulerManager implements SchedulerInterface {

    /**
     * The Scheduler Manager runs the scheduled tasks.A scheduled task cannot specify the interval at which it wants to be triggered.
     * It's only a mechanism to understand that must be triggered by a CRON.
     * When used with a CRON, a scheduled task will be triggered at a recurring interval, it is your own responsibility to implement a
     * logic of executing or not based on how long it's been since the last execution.
     * Please look at the aws-scheduling module for an example of how to setup a CRON using AWS Event Bridge with Pristine's listeners.
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
        this.logHandler.info("SchedulerManager: Starting the execution of the tasks.", {extra: {scheduledTasks: this.scheduledTasks}}, `${SchedulingModuleKeyname}:scheduler.manager:enter`);

        return new Promise(resolve => {
            const promises: Promise<void>[] = [];

            this.scheduledTasks.forEach(scheduledTask => {
                promises.push(scheduledTask.run());
            });

            this.logHandler.info("SchedulerManager: Completed triggering all the tasks.", {extra: {scheduledTasks: this.scheduledTasks}}, `${SchedulingModuleKeyname}:scheduler.manager:return`);

            Promise.allSettled(promises).then(results => {
                results.forEach(result => {
                    if(result.status === 'fulfilled') {
                        this.logHandler.debug("SchedulerManager: Scheduled Task Fulfilled.", {extra: {result}})
                    }
                    else {
                        this.logHandler.error("SchedulerManager: Scheduled Task Error.", {
                            extra: {
                                result: {
                                    status: result.status,
                                    reason: result.reason + "",
                                }
                            }
                        })
                    }
                });

                return resolve();
            });
        })
    }
}
