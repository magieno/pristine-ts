import {EventarcMessageModel} from "../models/eventarc-message.model";
import {GcpClientOptionsInterface} from "./client-options.interface";

export interface EventarcClientInterface {
  publish(events: EventarcMessageModel | EventarcMessageModel[], channel?: string, options?: Partial<GcpClientOptionsInterface>): Promise<void>;
}
