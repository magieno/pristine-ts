import {Event, EventListenerInterface} from "@pristine-ts/event";
import {injectable, injectAll} from "tsyringe";
import {EventBridgePayload} from "../../../aws/src/event-payloads/event-bridge.payload";
import {ScheduledTaskInterface} from "../interfaces/scheduled-task.interface";
import {ServiceDefinitionTagEnum} from "@pristine-ts/common";

@injectable()
export class SchedulerManager implements EventListenerInterface {
    constructor(@injectAll(ServiceDefinitionTagEnum.ScheduledTask) private readonly scheduledTasks: ScheduledTaskInterface[]) {
    }

    /**
     *
     * @param event
     */
    async handle<T>(event: Event<T>): Promise<void> {
        const promises: Promise<void>[] = [];

        this.scheduledTasks.forEach(scheduledTask => {
            promises.push(scheduledTask.run());
        })

        await Promise.all(promises);
    }

    /**
     * "aws.events" is the source of the CloudWatch Schedule Events: https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/EventTypes.html#schedule_event_type
     * @param event
     */
    supports<T>(event: Event<T>): boolean {
        return event.payload !== undefined && event.payload instanceof EventBridgePayload && event.payload.hasOwnProperty("source") && event.payload.source === ": string;";
    }

}
