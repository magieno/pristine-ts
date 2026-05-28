import "reflect-metadata";
import {container} from "tsyringe";
import {EventIdGenerationStyleEnum, EventIdManager} from "@pristine-ts/core";
import {FirestoreEventMapper, FirestoreEventPayload, FirestoreEventType} from "@pristine-ts/gcp";
import * as path from "path";
import * as fs from "fs";

const fixture = (name: string) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "files", "gcp", name), "utf-8"));

describe("GCP Firestore event mapper (E2E)", () => {
    beforeEach(() => container.clearInstances());

    it("supportsMapping returns true for a Firestore document CloudEvent", () => {
        const mapper = new FirestoreEventMapper(new EventIdManager(EventIdGenerationStyleEnum.Uuid));
        expect(mapper.supportsMapping(fixture("firestore-created.cloudevent.json"), {} as any)).toBe(true);
        expect(mapper.supportsMapping(fixture("firestore-updated.cloudevent.json"), {} as any)).toBe(true);
    });

    it("map extracts document path, value, and the Created enum", () => {
        const mapper = new FirestoreEventMapper(new EventIdManager(EventIdGenerationStyleEnum.Uuid));
        const result = mapper.map(fixture("firestore-created.cloudevent.json"), {} as any);
        const event = result.events[0];
        expect(event.type).toBe(FirestoreEventType.DocumentCreated);
        const payload = event.payload as FirestoreEventPayload;
        expect(payload.documentPath).toBe("projects/test-project/databases/(default)/documents/users/abc123");
        expect(payload.value?.email).toEqual({stringValue: "user@example.com"});
    });

    it("map extracts updateMask for updated events", () => {
        const mapper = new FirestoreEventMapper(new EventIdManager(EventIdGenerationStyleEnum.Uuid));
        const result = mapper.map(fixture("firestore-updated.cloudevent.json"), {} as any);
        const payload = result.events[0].payload as FirestoreEventPayload;
        expect(result.events[0].type).toBe(FirestoreEventType.DocumentUpdated);
        expect(payload.updateMask).toEqual(["active"]);
        expect(payload.oldValue?.active).toEqual({booleanValue: true});
        expect(payload.value?.active).toEqual({booleanValue: false});
    });
});
