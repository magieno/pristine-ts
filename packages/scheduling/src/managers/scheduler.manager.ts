import {injectable, injectAll, inject} from "tsyringe";
import {ScheduledTaskInterface} from "../interfaces/scheduled-task.interface";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {SchedulingModuleKeyname} from "../scheduling.module.keyname";
import {SchedulerInterface} from "../interfaces/scheduler.interface";
import {LogHandlerInterface} from "@pristine-ts/logging";

@moduleScoped(SchedulingModuleKeyname)
@tag("SchedulerInterface")
@injectable()
export class SchedulerManager implements SchedulerInterface {
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

            this.logHandler.debug("Completed the execution of the tasks.", {scheduledTasks: this.scheduledTasks}, SchedulingModuleKeyname);

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
