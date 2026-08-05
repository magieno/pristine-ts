import "reflect-metadata";
import {ExitCode} from "@pristine-ts/common";
import {SeverityEnum} from "@pristine-ts/logging";
import {LogsCommand} from "./logs.command";
import {LogsCommandOptions} from "./logs.command-options";
import {LogsAliasCommand} from "./logs-alias.command";

interface ReadCall {
  id?: string;
  limit?: number;
}

/**
 * Minimal collaborators so `run()` can be driven without a live kernel or a real store.
 */
const buildCommand = (entries: Record<string, any>[] = []): {
  command: LogsCommand;
  lines: string[];
  reads: ReadCall[];
} => {
  const lines: string[] = [];
  const reads: ReadCall[] = [];
  const cliOutput = {writeLine: (message: string): void => {lines.push(message);}} as any;
  const logStore = {
    read: (id?: string, options: {limit?: number} = {}): Record<string, any>[] => {
      reads.push({id, limit: options.limit});
      return entries;
    },
    tail: (): {stop(): void} => ({stop: (): void => undefined}),
  } as any;

  return {command: new LogsCommand(cliOutput, logStore), lines, reads};
};

const makeEntries = (count: number): Record<string, any>[] =>
  Array.from({length: count}, (_, index) => ({
    severity: SeverityEnum.Info,
    message: `message-${index}`,
    date: new Date("2026-01-01T00:00:00.000Z").toISOString(),
  }));

const optionsFrom = (values: Partial<LogsCommandOptions>): LogsCommandOptions =>
  Object.assign(new LogsCommandOptions(), values);

describe("LogsCommand", () => {
  it("caps the read at the default limit so a full store is never materialized", async () => {
    const {command, reads} = buildCommand();

    await command.run(optionsFrom({}));

    expect(reads).toEqual([{id: undefined, limit: LogsCommandOptions.DEFAULT_LIMIT}]);
  });

  it("honours an explicit --limit", async () => {
    const {command, reads} = buildCommand();

    await command.run(optionsFrom({limit: 5}));

    expect(reads[0].limit).toBe(5);
  });

  it("treats --limit 0 as unlimited", async () => {
    const {command, reads} = buildCommand();

    await command.run(optionsFrom({limit: 0}));

    expect(reads[0].limit).toBeUndefined();
  });

  it("says so when the output was truncated by the limit", async () => {
    const {command, lines} = buildCommand(makeEntries(5));

    await command.run(optionsFrom({limit: 5}));

    expect(lines[0]).toContain("5 most recent entries");
    expect(lines).toHaveLength(6);
  });

  it("stays quiet about the limit when fewer entries than the cap exist", async () => {
    const {command, lines} = buildCommand(makeEntries(2));

    const result = await command.run(optionsFrom({limit: 5}));

    expect(result).toBe(ExitCode.Success);
    expect(lines).toHaveLength(2);
    expect(lines[0]).not.toContain("most recent entries");
  });

  it("passes the filter id through to the store", async () => {
    const {command, reads} = buildCommand();

    await command.run(optionsFrom({"event-id": "event-42"}));

    expect(reads[0].id).toBe("event-42");
  });
});

describe("LogsAliasCommand", () => {
  it("declares the same options type as the command it delegates to", () => {
    // `optionsType = null` would hand `run()` a raw object with no getters, silently
    // dropping both the filter id and the --limit default.
    const alias = new LogsAliasCommand(buildCommand().command);

    expect(alias.optionsType).toBe(LogsCommandOptions);
  });

  it("delegates to the command", async () => {
    const {command, reads} = buildCommand();
    const alias = new LogsAliasCommand(command);

    await alias.run(optionsFrom({limit: 7}));

    expect(reads[0].limit).toBe(7);
  });
});
