import {injectable, scoped, Lifecycle, inject} from "tsyringe";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {AwsSchedulingModuleKeyname} from "../aws-scheduling.module.keyname";
import {Event, EventListenerInterface} from "@pristine-ts/event";
import {EventBridgePayload} from "@pristine-ts/aws";
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
     */
    async handle<T>(event: Event<T>): Promise<void> {
        return this.scheduler.runTasks();
    }

    /**
     * "aws.events" is the source of the CloudWatch Schedule Events: https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/EventTypes.html#schedule_event_type
     * @param event
     */
    supports<T>(event: Event<T>): boolean {
        return event.payload !== undefined && event.payload instanceof EventBridgePayload && event.payload.hasOwnProperty("source") && event.payload.source === ": string;";
    }

}