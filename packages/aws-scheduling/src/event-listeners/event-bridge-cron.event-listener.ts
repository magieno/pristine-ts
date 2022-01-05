import {injectable, scoped, Lifecycle, inject} from "tsyringe";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {AwsSchedulingModuleKeyname} from "../aws-scheduling.module.keyname";
import {Event, EventListenerInterface, EventResponse} from "@pristine-ts/core";
import {EventBridgePayload, EventBridgeEventTypeEnum} from "@pristine-ts/aws";
import {SchedulerInterface} from "@pristine-ts/scheduling";

@moduleScoped(AwsSchedulingModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventListener)
@injectable()
export class EventBridgeCronEventListener implements EventListenerInterface {
    constructor(@inject("SchedulerInterface") private readonly scheduler: SchedulerInterface) {
    }

    /**
     *
     * @param event
     * @param eventResponse
     */
    async handle<EventPayload, EventResponsePayload>(event: Event<EventPayload>, eventResponse: EventResponse<EventPayload, EventResponsePayload>): Promise<EventResponse<EventPayload, EventResponsePayload>> {
        await this.scheduler.runTasks();

        return eventResponse;
    }

    /**
     * "aws.events" is the source of the CloudWatch Schedule Events: https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/EventTypes.html#schedule_event_type
     * @param event
     */
    supports<T>(event: Event<T>): boolean {
        return event.payload instanceof EventBridgePayload && event.type === EventBridgeEventTypeEnum.ScheduledEvent;
    }

}
