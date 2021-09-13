import {EventBridgeMessageModel} from "../models/event-bridge-message.model";

export interface EventBridgeClientInterface {
    send(eventBridgeMessages: EventBridgeMessageModel | EventBridgeMessageModel[], eventBusName: string, endpoint?: string): Promise<void>;
}