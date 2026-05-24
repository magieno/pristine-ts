import "reflect-metadata";
import {ExecutionContextKeynameEnum} from "@pristine-ts/core";
import {ReplStartEventMapper} from "./repl-start-event.mapper";
import {StartReplEventPayload} from "../event-payloads/start-repl.event-payload";

describe("ReplStartEventMapper", () => {
  const mapper = new ReplStartEventMapper();
  const cliContext = {keyname: ExecutionContextKeynameEnum.Cli, context: {}};

  describe("supportsMapping", () => {
    it("matches `[node, pristine]` (no command — drop into REPL)", () => {
      expect(mapper.supportsMapping(["node", "pristine"], cliContext)).toBe(true);
    });

    it("matches the explicit `pristine repl` form", () => {
      expect(mapper.supportsMapping(["node", "pristine", "repl"], cliContext)).toBe(true);
    });

    it("matches `pristine repl <extra>` (extra tokens after `repl` are ignored at routing time)", () => {
      expect(mapper.supportsMapping(["node", "pristine", "repl", "something"], cliContext)).toBe(true);
    });

    it("does NOT match when an explicit command is named", () => {
      expect(mapper.supportsMapping(["node", "pristine", "build"], cliContext)).toBe(false);
    });

    it("does NOT match under non-Cli keynames (REPL is only launched from the bin)", () => {
      expect(mapper.supportsMapping(["node", "pristine"], {
        keyname: ExecutionContextKeynameEnum.Http,
        context: {},
      })).toBe(false);
    });
  });

  describe("map", () => {
    it("produces a single StartReplEventPayload carrying the scriptPath", () => {
      const result = mapper.map(["node", "/path/to/pristine"], cliContext);

      expect(result.executionOrder).toBe("sequential");
      expect(result.events).toHaveLength(1);
      const payload = result.events[0].payload;
      expect(payload).toBeInstanceOf(StartReplEventPayload);
      expect(payload.scriptPath).toBe("/path/to/pristine");
    });
  });
});
