import "reflect-metadata";
import {container} from "tsyringe";
import {EventIdGenerationStyleEnum, EventIdManager} from "@pristine-ts/core";
import {
    EventarcEventMapper,
    EventarcEventPayload,
    EventarcEventType,
    CloudStorageEventMapper,
    FirestoreEventMapper,
    PubSubEventMapper,
} from "@pristine-ts/gcp";
import * as path from "path";
import * as fs from "fs";

const fixture = (name: string) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "files", "gcp", name), "utf-8"));

describe("GCP Eventarc catch-all mapper (E2E)", () => {
    beforeEach(() => container.clearInstances());

    it("supportsMapping returns true for a generic CloudEvent", () => {
        const mapper = new EventarcEventMapper(new EventIdManager(EventIdGenerationStyleEnum.Uuid));
        expect(mapper.supportsMapping(fixture("eventarc-generic.cloudevent.json"), {} as any)).toBe(true);
    });

    it("does not claim events that more-specific mappers own", () => {
        const eventarc = new EventarcEventMapper(new EventIdManager(EventIdGenerationStyleEnum.Uuid));
        expect(eventarc.supportsMapping(fixture("cloud-storage-finalized.cloudevent.json"), {} as any)).toBe(false);
        expect(eventarc.supportsMapping(fixture("firestore-created.cloudevent.json"), {} as any)).toBe(false);
    });

    it("only ONE mapper claims the generic CloudEvent", () => {
        const idMgr = new EventIdManager(EventIdGenerationStyleEnum.Uuid);
        const mappers = [
            new PubSubEventMapper(idMgr),
            new CloudStorageEventMapper(idMgr),
            new FirestoreEventMapper(idMgr),
            new EventarcEventMapper(idMgr),
        ];
        const raw = fixture("eventarc-generic.cloudevent.json");
        const matches = mappers.filter((m) => m.supportsMapping(raw, {} as any));
        expect(matches).toHaveLength(1);
        expect(matches[0]).toBeInstanceOf(EventarcEventMapper);
    });

    it("map populates id, type, source, subject, data verbatim", () => {
        const mapper = new EventarcEventMapper(new EventIdManager(EventIdGenerationStyleEnum.Uuid));
        const result = mapper.map(fixture("eventarc-generic.cloudevent.json"), {} as any);
        const event = result.events[0];
        expect(event.type).toBe(EventarcEventType.EventarcEvent);
        const payload = event.payload as EventarcEventPayload;
        expect(payload.id).toBe("eventarc-event-1");
        expect(payload.type).toBe("com.example.something.v1.happened");
        expect(payload.subject).toBe("things/widget-42");
        expect(payload.data).toEqual({widget: "42", action: "did-something"});
    });
});
