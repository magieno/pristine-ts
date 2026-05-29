import "reflect-metadata";
import {container} from "tsyringe";
import {Request, Response} from "@pristine-ts/common";
import {Event, EventIdGenerationStyleEnum, EventIdManager, EventResponse, ExecutionContextKeynameEnum} from "@pristine-ts/core";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {
    CloudFunctionGen1HttpEventMapper,
    CloudFunctionGen1HttpEventPayload,
    CloudFunctionGen2HttpEventMapper,
    CloudFunctionGen2HttpEventPayload,
    CloudRunHttpEventMapper,
    CloudRunHttpEventPayload,
    GcpFunctionsEventsHandlingStrategyEnum,
    GcpFunctionsEventTypeEnum,
    GcpFunctionsHttpEventResponsePayload,
} from "@pristine-ts/gcp-functions";
import * as path from "path";
import * as fs from "fs";

const fixture = (name: string) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "files", "gcp", name), "utf-8"));

const noopLog: LogHandlerInterface = {
    debug: () => {}, info: () => {}, warning: () => {}, error: () => {}, critical: () => {}, terminate: () => {},
} as any;

describe("GCP Cloud Functions / Cloud Run HTTP mappers (E2E)", () => {
    beforeEach(() => container.clearInstances());

    describe("Gen 1 HTTP", () => {
        it("Request strategy produces a Pristine Request", () => {
            const mapper = new CloudFunctionGen1HttpEventMapper(noopLog, GcpFunctionsEventsHandlingStrategyEnum.Request, new EventIdManager(EventIdGenerationStyleEnum.Uuid));
            const raw = fixture("cloud-function-gen-1-http.json");
            const ctx = {keyname: ExecutionContextKeynameEnum.GcpCloudFunction, context: {}} as any;
            expect(mapper.supportsMapping(raw, ctx)).toBe(true);
            const result = mapper.map(raw, ctx);
            expect(result.events).toHaveLength(1);
            const event = result.events[0];
            expect(event.type).toBe(GcpFunctionsEventTypeEnum.CloudFunctionGen1HttpEvent);
            const req = event.payload as Request;
            expect(req).toBeInstanceOf(Request);
            expect(req.url).toBe("/api/users");
            expect(req.id).toBe("gen1-req-1");
        });

        it("Event strategy produces a CloudFunctionGen1HttpEventPayload", () => {
            const mapper = new CloudFunctionGen1HttpEventMapper(noopLog, GcpFunctionsEventsHandlingStrategyEnum.Event, new EventIdManager(EventIdGenerationStyleEnum.Uuid));
            const raw = fixture("cloud-function-gen-1-http.json");
            const ctx = {keyname: ExecutionContextKeynameEnum.GcpCloudFunction, context: {}} as any;
            const result = mapper.map(raw, ctx);
            const payload = result.events[0].payload as CloudFunctionGen1HttpEventPayload;
            expect(payload).toBeInstanceOf(CloudFunctionGen1HttpEventPayload);
            expect(payload.method).toBe("POST");
            expect(payload.path).toBe("/api/users");
            expect(payload.body).toBe("{\"name\":\"alice\"}");
        });

        it("Gen 1 mapper rejects events whose context isn't GcpCloudFunction", () => {
            const mapper = new CloudFunctionGen1HttpEventMapper(noopLog, GcpFunctionsEventsHandlingStrategyEnum.Request, new EventIdManager(EventIdGenerationStyleEnum.Uuid));
            expect(mapper.supportsMapping(fixture("cloud-function-gen-1-http.json"), {keyname: ExecutionContextKeynameEnum.AwsLambda, context: {}} as any)).toBe(false);
        });

        it("Gen 1 mapper defers to Gen 2 when CloudEvent headers are present", () => {
            const gen1 = new CloudFunctionGen1HttpEventMapper(noopLog, GcpFunctionsEventsHandlingStrategyEnum.Request, new EventIdManager(EventIdGenerationStyleEnum.Uuid));
            const ctx = {keyname: ExecutionContextKeynameEnum.GcpCloudFunction, context: {}} as any;
            expect(gen1.supportsMapping(fixture("cloud-function-gen-2-cloudevent.json"), ctx)).toBe(false);
        });

        it("reverseMap converts a Pristine Response into a GcpFunctionsHttpEventResponsePayload", () => {
            const mapper = new CloudFunctionGen1HttpEventMapper(noopLog, GcpFunctionsEventsHandlingStrategyEnum.Request, new EventIdManager(EventIdGenerationStyleEnum.Uuid));
            const response = new Response();
            response.status = 200;
            response.body = {ok: true};
            response.setHeaders({"content-type": "application/json"});
            const event = new Event<Request>(GcpFunctionsEventTypeEnum.CloudFunctionGen1HttpEvent, new Request("get" as any, "/", "x"), "x");
            const reverse = mapper.reverseMap(new EventResponse(event, response), undefined, {keyname: ExecutionContextKeynameEnum.GcpCloudFunction, context: {}} as any);
            expect(reverse).toBeInstanceOf(GcpFunctionsHttpEventResponsePayload);
            expect(reverse.statusCode).toBe(200);
            expect(reverse.body).toBe("{\"ok\":true}");
            expect(reverse.headers["content-type"]).toBe("application/json");
        });
    });

    describe("Gen 2 CloudEvent", () => {
        it("supportsMapping picks up binary-mode CloudEvent headers", () => {
            const mapper = new CloudFunctionGen2HttpEventMapper(noopLog, GcpFunctionsEventsHandlingStrategyEnum.Event, new EventIdManager(EventIdGenerationStyleEnum.Uuid));
            const ctx = {keyname: ExecutionContextKeynameEnum.GcpCloudFunction, context: {}} as any;
            expect(mapper.supportsMapping(fixture("cloud-function-gen-2-cloudevent.json"), ctx)).toBe(true);
        });

        it("Event strategy extracts CloudEvent attributes from headers", () => {
            const mapper = new CloudFunctionGen2HttpEventMapper(noopLog, GcpFunctionsEventsHandlingStrategyEnum.Event, new EventIdManager(EventIdGenerationStyleEnum.Uuid));
            const raw = fixture("cloud-function-gen-2-cloudevent.json");
            const ctx = {keyname: ExecutionContextKeynameEnum.GcpCloudFunction, context: {}} as any;
            const result = mapper.map(raw, ctx);
            const payload = result.events[0].payload as CloudFunctionGen2HttpEventPayload;
            expect(payload).toBeInstanceOf(CloudFunctionGen2HttpEventPayload);
            expect(payload.id).toBe("gen2-ce-1");
            expect(payload.type).toBe("com.example.custom");
            expect(payload.source).toBe("//example.com/source");
            expect(payload.data).toEqual({hello: "world"});
        });
    });

    describe("Cloud Run HTTP", () => {
        it("supportsMapping gates on GcpCloudRun execution context", () => {
            const mapper = new CloudRunHttpEventMapper(noopLog, GcpFunctionsEventsHandlingStrategyEnum.Event, new EventIdManager(EventIdGenerationStyleEnum.Uuid));
            expect(mapper.supportsMapping(fixture("cloud-run-http.json"), {keyname: ExecutionContextKeynameEnum.GcpCloudRun, context: {}} as any)).toBe(true);
            expect(mapper.supportsMapping(fixture("cloud-run-http.json"), {keyname: ExecutionContextKeynameEnum.GcpCloudFunction, context: {}} as any)).toBe(false);
        });

        it("Event strategy produces CloudRunHttpEventPayload distinct from Gen 1", () => {
            const mapper = new CloudRunHttpEventMapper(noopLog, GcpFunctionsEventsHandlingStrategyEnum.Event, new EventIdManager(EventIdGenerationStyleEnum.Uuid));
            const ctx = {keyname: ExecutionContextKeynameEnum.GcpCloudRun, context: {}} as any;
            const result = mapper.map(fixture("cloud-run-http.json"), ctx);
            const payload = result.events[0].payload as CloudRunHttpEventPayload;
            expect(payload).toBeInstanceOf(CloudRunHttpEventPayload);
            expect(result.events[0].type).toBe(GcpFunctionsEventTypeEnum.CloudRunHttpEvent);
            expect(payload.method).toBe("GET");
            expect(payload.path).toBe("/api/health");
        });
    });
});
