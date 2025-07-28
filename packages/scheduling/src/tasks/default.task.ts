import {ScheduledTaskInterface} from "../interfaces/scheduled-task.interface";
import {injectable} from "tsyringe";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";

/**
 * The default task is here so that there is at least one service with the ServiceDefinitionTagEnum.ScheduledTask.
 * It does not do anything.
 * Until there's a fix for: https://github.com/microsoft/tsyringe/issues/63
 */
@injectable()
@tag(ServiceDefinitionTagEnum.ScheduledTask)
export class DefaultTask implements ScheduledTaskInterface {
  async run(): Promise<void> {
  }
}
