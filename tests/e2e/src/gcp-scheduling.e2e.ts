import "reflect-metadata";
import {container} from "tsyringe";
import {Event, EventIdGenerationStyleEnum, EventIdManager} from "@pristine-ts/core";
import {SchedulerInterface} from "@pristine-ts/scheduling";
import {PubSubEventMapper, PubSubEventPayload} from "@pristine-ts/gcp";
import {
    CloudFunctionGen1HttpEventMapper,
    CloudFunctionGen1HttpEventPayload,
    GcpFunctionsEventsHandlingStrategyEnum,
    GcpFunctionsEventTypeEnum,
} from "@pristine-ts/gcp-functions";
import {CloudSchedulerEventHandler} from "@pristine-ts/gcp-scheduling";
import * as path from "path";
import * as fs from "fs";

const fixture = (name: string) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "files", "gcp", name), "utf-8"));
const noopLog = {debug: () => {}, info: () => {}, warning: () => {}, error: () => {}, critical: () => {}, terminate: () => {}};

const makeScheduler = (): SchedulerInterface & {runTasks: jest.Mock} => {
    const m = {runTasks: jest.fn(async (_: string) => {})} as any;
    return m;
};

describe("GCP Cloud Scheduler event handler (E2E)", () => {
    beforeEach(() => container.clearInstances());

    it("claims a Pub/Sub-delivered scheduler tick and runs the job", async () => {
        const scheduler = makeScheduler();
        const handler = new CloudSchedulerEventHandler(scheduler);
        const mapper = new PubSubEventMapper(new EventIdManager(EventIdGenerationStyleEnum.Uuid));
        const raw = fixture("cloud-scheduler-pub-sub.json");
        const mapped = mapper.map(raw, {} as any);
        const event = mapped.events[0] as Event<PubSubEventPayload>;

        expect(handler.supports(event)).toBe(true);
        await handler.handle(event);
        expect(scheduler.runTasks).toHaveBeenCalledWith("projects/test-project/locations/us-central1/jobs/daily-cleanup");
    });

    it("does NOT claim Pub/Sub messages from sources other than Cloud Scheduler", () => {
        const handler = new CloudSchedulerEventHandler(makeScheduler());
        const mapper = new PubSubEventMapper(new EventIdManager(EventIdGenerationStyleEnum.Uuid));
        const raw = fixture("pub-sub-push.json");
        const event = mapper.map(raw, {} as any).events[0] as Event<PubSubEventPayload>;
        expect(handler.supports(event)).toBe(false);
    });

    it("claims an HTTP-delivered scheduler tick and runs the job", async () => {
        const scheduler = makeScheduler();
        const handler = new CloudSchedulerEventHandler(scheduler);
        const mapper = new CloudFunctionGen1HttpEventMapper(noopLog as any, GcpFunctionsEventsHandlingStrategyEnum.Event, new EventIdManager(EventIdGenerationStyleEnum.Uuid));
        const raw = fixture("cloud-scheduler-http.json");
        const event = mapper.map(raw, {keyname: "GCP_CLOUD_FUNCTION", context: {}} as any).events[0] as Event<CloudFunctionGen1HttpEventPayload>;

        expect(handler.supports(event)).toBe(true);
        await handler.handle(event);
        expect(scheduler.runTasks).toHaveBeenCalledWith("projects/test-project/locations/us-central1/jobs/hourly-rollup");
    });

    it("does NOT claim regular HTTP requests without the X-CloudScheduler header", () => {
        const handler = new CloudSchedulerEventHandler(makeScheduler());
        const mapper = new CloudFunctionGen1HttpEventMapper(noopLog as any, GcpFunctionsEventsHandlingStrategyEnum.Event, new EventIdManager(EventIdGenerationStyleEnum.Uuid));
        const raw = fixture("cloud-function-gen-1-http.json");
        const event = mapper.map(raw, {keyname: "GCP_CLOUD_FUNCTION", context: {}} as any).events[0];
        expect(handler.supports(event as any)).toBe(false);
    });

    it("handle returns an EventResponse referencing the originating event", async () => {
        const handler = new CloudSchedulerEventHandler(makeScheduler());
        const mapper = new PubSubEventMapper(new EventIdManager(EventIdGenerationStyleEnum.Uuid));
        const raw = fixture("cloud-scheduler-pub-sub.json");
        const event = mapper.map(raw, {} as any).events[0];
        const response = await handler.handle(event as any);
        expect(response.event).toBe(event);
    });
});
