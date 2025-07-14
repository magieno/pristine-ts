import {injectable, scoped, Lifecycle, inject} from "tsyringe";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {AwsSchedulingModuleKeyname} from "../aws-scheduling.module.keyname";
import {Event, EventHandlerInterface, EventListenerInterface, EventResponse} from "@pristine-ts/core";
import {EventBridgePayload, EventBridgeEventTypeEnum} from "@pristine-ts/aws";
import {SchedulerInterface} from "@pristine-ts/scheduling";

@moduleScoped(AwsSchedulingModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventHandler)
@injectable()
export class EventBridgeCronEventHandler implements EventHandlerInterface<any, any> {
    constructor(@inject("SchedulerInterface") private readonly scheduler: SchedulerInterface) {
    }

    /**
     * This method listens to an Event and triggers the schedulers.
     *
     * @param event
     */
    async handle(event: Event<any>): Promise<EventResponse<any, any>> {
        await this.scheduler.runTasks(event.id);

        return new EventResponse<any, any>(event, {});
    }

    /**
     * "aws.events" is the source of the CloudWatch Schedule Events: https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/EventTypes.html#schedule_event_type
     * @param event
     */
    supports<T>(event: Event<T>): boolean {
        return event.payload instanceof EventBridgePayload && event.type === EventBridgeEventTypeEnum.ScheduledEvent;
    }
}
