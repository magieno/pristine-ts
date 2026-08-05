import "reflect-metadata";
import {ExitCode} from "@pristine-ts/common";
import {RequestsCommand} from "./requests.command";
import {RequestsCommandOptions} from "./requests.command-options";
import {RequestsAliasCommand} from "./requests-alias.command";

/**
 * Minimal collaborators so `run()` can be driven without a live kernel or a real store.
 */
const buildCommand = (count = 3): {command: RequestsCommand; lines: string[]; limits: (number | undefined)[]} => {
  const lines: string[] = [];
  const limits: (number | undefined)[] = [];
  const cliOutput = {writeLine: (message: string): void => {lines.push(message);}} as any;

  const traceStore = {
    recentRequests: (limit?: number): any[] => {
      limits.push(limit);
      return Array.from({length: count}, (_, index) => ({
        eventId: `event-${index}`,
        startedAt: 1_700_000_000_000 + index,
        durationMs: 10,
        rootKeyname: "root.execution",
        httpMethod: "GET",
        httpPath: "/products",
        httpStatus: 200,
      }));
    },
  } as any;

  return {command: new RequestsCommand(cliOutput, traceStore), lines, limits};
};

const optionsFrom = (values: Partial<RequestsCommandOptions>): RequestsCommandOptions =>
  Object.assign(new RequestsCommandOptions(), values);

describe("RequestsCommand", () => {
  it("applies the default limit when none was given", async () => {
    const {command, limits} = buildCommand();

    const result = await command.run(optionsFrom({}));

    // The default documented on the option: `pristine requests` shows the last 20.
    expect(limits).toEqual([20]);
    expect(result).toBe(ExitCode.Success);
  });

  it("honours an explicit --limit", async () => {
    const {command, limits} = buildCommand();

    await command.run(optionsFrom({limit: 5}));

    expect(limits).toEqual([5]);
  });
});

describe("RequestsAliasCommand", () => {
  it("declares the same options type as the command it delegates to", () => {
    // With `optionsType = null` the raw argument object reaches `run()` unmapped and
    // unvalidated — `--limit abc` would travel through as a string.
    const alias = new RequestsAliasCommand(buildCommand().command);

    expect(alias.optionsType).toBe(RequestsCommandOptions);
  });

  it("delegates to the command", async () => {
    const {command, limits} = buildCommand();
    const alias = new RequestsAliasCommand(command);

    await alias.run(optionsFrom({limit: 9}));

    expect(limits).toEqual([9]);
  });
});
