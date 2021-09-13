export class EventBridgePayload {
    id: string;
    detailType: string;
    source: string;
    account: string;
    time: string;
    region: string;
    resources: string[] = [];
    detail: any;
}
