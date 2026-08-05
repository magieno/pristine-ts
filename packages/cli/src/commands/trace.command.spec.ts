import "reflect-metadata";
import {ExitCode, Span, Trace} from "@pristine-ts/common";
import {TraceCommand} from "./trace.command";
import {TraceCommandOptions} from "./trace.command-options";
import {TraceAliasCommand} from "./trace-alias.command";

/**
 * Minimal collaborators so `run()` can be driven without a live kernel or a real store.
 */
const buildCommand = (): {command: TraceCommand; lines: string[]; lookups: string[]} => {
  const lines: string[] = [];
  const lookups: string[] = [];
  const cliOutput = {writeLine: (message: string): void => {lines.push(message);}} as any;

  const trace = new Trace("event-42", {});
  trace.startDate = 1000;
  trace.endDate = 1042;
  trace.rootSpan = new Span("root.execution", "span-root");
  trace.rootSpan.startDate = 1000;
  trace.rootSpan.endDate = 1042;

  const traceStore = {
    find: (id: string): {trace: Trace; eventId: string} | undefined => {
      lookups.push(id);
      return id === "event-42" ? {trace, eventId: "event-42"} : undefined;
    },
    findSerialized: (id: string): {trace: any; eventId: string} | undefined => {
      lookups.push(id);
      return id === "event-42" ? {trace: {id: "event-42"}, eventId: "event-42"} : undefined;
    },
  } as any;

  return {command: new TraceCommand(cliOutput, traceStore), lines, lookups};
};

const optionsFrom = (values: Partial<TraceCommandOptions>): TraceCommandOptions =>
  Object.assign(new TraceCommandOptions(), values);

describe("TraceCommand", () => {
  it("looks up a positional id", async () => {
    const {command, lookups} = buildCommand();

    const result = await command.run(optionsFrom({_: ["event-42"]}));

    expect(lookups).toContain("event-42");
    expect(result).toBe(ExitCode.Success);
  });

  it("prefers an explicit flag over the positional", async () => {
    const {command, lookups} = buildCommand();

    await command.run(optionsFrom({"event-id": "event-42", _: ["ignored"]}));

    expect(lookups).toEqual(["event-42"]);
  });

  it("prints usage when no id was given at all", async () => {
    const {command, lines, lookups} = buildCommand();

    const result = await command.run(optionsFrom({}));

    expect(lookups).toEqual([]);
    expect(lines[0]).toContain("Usage:");
    expect(result).toBe(ExitCode.Error);
  });
});

describe("TraceAliasCommand", () => {
  it("declares the same options type as the command it delegates to", () => {
    // `optionsType = null` would hand `run()` a raw object with no `lookupId` getter, so
    // `pristine trace <id>` would print usage instead of the trace.
    const alias = new TraceAliasCommand(buildCommand().command);

    expect(alias.optionsType).toBe(TraceCommandOptions);
  });

  it("delegates to the command", async () => {
    const {command, lookups} = buildCommand();
    const alias = new TraceAliasCommand(command);

    await alias.run(optionsFrom({_: ["event-42"]}));

    expect(lookups).toContain("event-42");
  });
});
