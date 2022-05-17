/**
 * Model representing an Event bridge message.
 */
export class EventBridgeMessageModel {
    resources: string[] = [];
    detailType: string;
    source: string;
    detail: any;
}
