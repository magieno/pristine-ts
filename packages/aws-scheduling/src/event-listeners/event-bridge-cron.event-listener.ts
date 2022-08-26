import {injectable, inject} from "tsyringe";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {AwsSchedulingModuleKeyname} from "../aws-scheduling.module.keyname";
import {Event, EventListenerInterface} from "@pristine-ts/core";
import {EventBridgePayload, EventBridgeEventTypeEnum} from "@pristine-ts/aws";
import {SchedulerInterface} from "@pristine-ts/scheduling";

/**
 * The EventBridgeCronEventListener listens to Cron events coming from AWS event bridge and executes a task.
 * It is tagged as an ServiceDefinitionTagEnum.EventListener so that it can be injected with all the other event listener.
 * It is module scoped so that it gets injected only if the AwsSchedulingModule is imported.
 */
@moduleScoped(AwsSchedulingModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventListener)
@injectable()
export class EventBridgeCronEventListener implements EventListenerInterface {

    /**
     * The EventBridgeCronEventListener listens to Cron events coming from AWS event bridge and executes a task.
     * @param scheduler The scheduler.
     */
    constructor(@inject("SchedulerInterface") private readonly scheduler: SchedulerInterface) {
    }

    /**
     * This method listens to an Event and triggers the schedulers.
     *
     * @param event
     */
    async execute<EventPayload>(event: Event<EventPayload>): Promise<void> {
        await this.scheduler.runTasks();

        return Promise.resolve();
    }

    /**
     * "aws.events" is the source of the CloudWatch Schedule Events: https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/EventTypes.html#schedule_event_type
     * @param event
     */
    supports<T>(event: Event<T>): boolean {
        return event.payload instanceof EventBridgePayload && event.type === EventBridgeEventTypeEnum.ScheduledEvent;
    }

}
