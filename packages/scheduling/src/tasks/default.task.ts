import {ScheduledTaskInterface} from "../interfaces/scheduled-task.interface";
import {injectable} from "tsyringe";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";

@injectable()
@tag(ServiceDefinitionTagEnum.ScheduledTask)
export class DefaultTask implements ScheduledTaskInterface{
    async run(): Promise<void> {
    }
}
