import {inject, injectable} from "tsyringe";
import * as crypto from "crypto";
import {injectConfig, moduleScoped, tag, traced} from "@pristine-ts/common";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {PublisherClient} from "@google-cloud/eventarc-publishing";
import {GcpModuleKeyname} from "../gcp.module.keyname";
import {GcpConfigurationKeys} from "../gcp.configuration-keys";
import {EventarcClientInterface} from "../interfaces/eventarc-client.interface";
import {EventarcMessageModel} from "../models/eventarc-message.model";
import {EventarcPublishError} from "../errors/eventarc-publish.error";
import {GcpClientOptionsInterface} from "../interfaces/client-options.interface";

/**
 * Client for publishing CloudEvents through Eventarc. Mirrors `EventBridgeClient` in
 * `@pristine-ts/aws`. Uses the Eventarc Publishing API (`PublisherClient`) which lets
 * services emit CloudEvents to a channel for routing.
 */
@tag("EventarcClientInterface")
@moduleScoped(GcpModuleKeyname)
@injectable()
export class EventarcClient implements EventarcClientInterface {
  private client?: PublisherClient;

  constructor(
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    @injectConfig(GcpConfigurationKeys.ProjectId) private readonly projectId: string,
    @injectConfig(GcpConfigurationKeys.Region) private readonly region: string,
  ) {
  }

  getClient(): PublisherClient {
    return this.client = this.client ?? new PublisherClient();
  }

  /**
   * Publish one or more CloudEvents to an Eventarc channel.
   *
   * @param events One event or a batch.
   * @param channel Channel id (bare or fully-qualified). Defaults to the configured
   *   project's default region channel `projects/{p}/locations/{r}/channels/default`.
   */
  @traced()
  async publish(
    events: EventarcMessageModel | EventarcMessageModel[],
    channel?: string,
    options?: Partial<GcpClientOptionsInterface>,
  ): Promise<void> {
    const channelName = channel?.startsWith("projects/")
      ? channel
      : `projects/${this.projectId}/locations/${this.region}/channels/${channel ?? "default"}`;
    const batch = Array.isArray(events) ? events : [events];
    this.logHandler.debug("EventarcClient: Publishing events.", {
      extra: {channelName, count: batch.length},
      eventId: options?.eventId,
      eventGroupId: options?.eventGroupId,
    });
    try {
      // The eventarc-publishing SDK expects events as protobuf `Any`-wrapped CloudEvents;
      // we hand a structured CloudEvent JSON string via the `textEvent` field. The SDK's
      // generated types are very loose here (`IAny[]`), so we cast.
      await this.getClient().publishChannelConnectionEvents({
        channelConnection: channelName,
        events: batch.map((event) => ({
          textEvent: JSON.stringify({
            specversion: "1.0",
            id: crypto.randomUUID(),
            type: event.type,
            source: event.source,
            subject: event.subject,
            datacontenttype: event.dataContentType ?? "application/json",
            data: event.data,
          }),
        })) as any,
      });
    } catch (error) {
      this.logHandler.error("EventarcClient: Failed to publish events.", {
        extra: {error, channelName},
        eventId: options?.eventId,
      });
      throw new EventarcPublishError(error);
    }
  }
}
