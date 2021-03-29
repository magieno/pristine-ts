import {SnsModel} from "../models/sns.model";

export class SnsEventPayload {
    eventVersion: string;
    eventSource: string;
    eventSubscriptionArn: string;
    sns: SnsModel;
}
