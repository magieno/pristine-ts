import {injectable, injectAll} from "tsyringe";
import {ScheduledTaskInterface} from "../interfaces/scheduled-task.interface";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {SchedulingModuleKeyname} from "../scheduling.module.keyname";
import {SchedulerInterface} from "../interfaces/scheduler.interface";

@moduleScoped(SchedulingModuleKeyname)
@tag("SchedulerInterface")
@injectable()
export class SchedulerManager implements SchedulerInterface {
    constructor(@injectAll(ServiceDefinitionTagEnum.ScheduledTask) private readonly scheduledTasks: ScheduledTaskInterface[]) {
    }

    /**
     * This method runs all the tasks that were registered.
     */
    async runTasks(): Promise<void> {
        const promises: Promise<void>[] = [];

        this.scheduledTasks.forEach(scheduledTask => {
            promises.push(scheduledTask.run());
        })

        await Promise.all(promises);
    }
}
