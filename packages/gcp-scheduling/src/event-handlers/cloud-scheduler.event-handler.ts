import {inject, injectable} from "tsyringe";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {Event, EventHandlerInterface, EventResponse} from "@pristine-ts/core";
import {SchedulerInterface} from "@pristine-ts/scheduling";
import {PubSubEventPayload, PubSubEventType} from "@pristine-ts/gcp";
import {
  CloudFunctionGen1HttpEventPayload,
  CloudFunctionGen2HttpEventPayload,
  CloudRunHttpEventPayload,
  GcpFunctionsEventTypeEnum,
} from "@pristine-ts/gcp-functions";
import {GcpSchedulingModuleKeyname} from "../gcp-scheduling.module.keyname";

/**
 * Handler that picks up Cloud Scheduler ticks. Cloud Scheduler can deliver in two ways:
 *
 *   1. **Pub/Sub target** — the scheduler publishes to a topic; the function/service
 *      receives a normal Pub/Sub push delivery. The message attribute `userAgent`
 *      starts with `Google-Cloud-Scheduler`, and the message attribute or body
 *      carries the job name.
 *
 *   2. **HTTP target** — the scheduler hits an HTTP endpoint with the
 *      `X-CloudScheduler: true` and `X-CloudScheduler-JobName` headers set.
 *
 * Both paths end up calling `SchedulerInterface.runTasks(jobName)`. Mirror of
 * `EventBridgeCronEventHandler` in `@pristine-ts/aws-scheduling`.
 */
@moduleScoped(GcpSchedulingModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventHandler)
@injectable()
export class CloudSchedulerEventHandler implements EventHandlerInterface<any, any> {
  constructor(@inject("SchedulerInterface") private readonly scheduler: SchedulerInterface) {
  }

  async handle(event: Event<any>): Promise<EventResponse<any, any>> {
    const jobName = this.extractJobName(event);
    await this.scheduler.runTasks(jobName ?? event.id);
    return new EventResponse<any, any>(event, {});
  }

  supports<T>(event: Event<T>): boolean {
    if (event.payload instanceof PubSubEventPayload && event.type === PubSubEventType.Message) {
      const userAgent = event.payload.attributes?.["userAgent"];
      return typeof userAgent === "string" && userAgent.startsWith("Google-Cloud-Scheduler");
    }
    if (
      event.type === GcpFunctionsEventTypeEnum.CloudFunctionGen1HttpEvent ||
      event.type === GcpFunctionsEventTypeEnum.CloudFunctionGen2HttpEvent ||
      event.type === GcpFunctionsEventTypeEnum.CloudRunHttpEvent
    ) {
      const headers = this.getHeaders(event);
      if (!headers) {
        return false;
      }
      const flag = (headers["x-cloudscheduler"] ?? headers["X-CloudScheduler"]) as string | undefined;
      return typeof flag === "string" && flag.toLowerCase() === "true";
    }
    return false;
  }

  private extractJobName(event: Event<any>): string | undefined {
    if (event.payload instanceof PubSubEventPayload) {
      return event.payload.attributes?.["jobName"]
        ?? event.payload.attributes?.["job-name"]
        ?? event.payload.body;
    }
    const headers = this.getHeaders(event);
    if (headers) {
      const job = headers["x-cloudscheduler-jobname"] ?? headers["X-CloudScheduler-JobName"];
      if (typeof job === "string") {
        return job;
      }
    }
    return undefined;
  }

  private getHeaders(event: Event<any>): { [k: string]: string | string[] } | undefined {
    if (event.payload instanceof CloudFunctionGen1HttpEventPayload
        || event.payload instanceof CloudRunHttpEventPayload) {
      return event.payload.headers;
    }
    if (event.payload instanceof CloudFunctionGen2HttpEventPayload) {
      return event.payload.headers;
    }
    return undefined;
  }
}
