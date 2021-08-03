import {SnsModel} from "../models/sns.model";

/**
 * The Pristine event payload type of a parsed SNS event
 */
export class SnsEventPayload {
    eventVersion: string;
    eventSource: string;
    eventSubscriptionArn: string;
    sns: SnsModel;
}
