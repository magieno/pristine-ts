import "reflect-metadata";
import fs from "fs";
import {ExitCode} from "@pristine-ts/common";
import {InfoCommand} from "./info.command";
import {CliPackageJsonResolver} from "../utils/cli-package-json.resolver";

/**
 * Minimal collaborators so the command can be constructed and run() driven without a live kernel.
 */
const buildCommand = (overrides: {
  readVersion?: () => string;
} = {}): {command: InfoCommand; lines: string[]} => {
  const lines: string[] = [];
  const cliOutput = {writeLine: (message: string): void => {lines.push(message);}} as any;
  const logHandler = {
    info: (): void => {}, error: (): void => {}, warning: (): void => {}, debug: (): void => {},
    critical: (): void => {}, notice: (): void => {}, success: (): void => {}, terminate: (): void => {},
  } as any;
  const configLoader = {load: async (): Promise<any> => ({configFilePath: undefined, config: {}})} as any;
  const appModuleLoader = {load: async (): Promise<any> => ({appModule: {keyname: "TestAppModule"}, plugins: []})} as any;
  const resolver = {readVersion: overrides.readVersion ?? ((): string => "1.2.3")} as any;

  const command = new InfoCommand(logHandler, cliOutput, configLoader, appModuleLoader, resolver);
  return {command, lines};
};

describe("InfoCommand", () => {
  it("does not read the filesystem or resolve any path at construction time", () => {
    // Regression: the version path used to be resolved eagerly in a field initializer
    // (`path.resolve(__dirname, ...)`), which ran the moment the command was constructed —
    // and construction happens during DI wiring in every app that imports CliModule (including
    // HTTP/Lambda via HttpModule). A real CliPackageJsonResolver is injected here so any eager
    // read would surface.
    const spy = jest.spyOn(fs, "readFileSync");
    try {
      const cliOutput = {writeLine: (): void => {}} as any;
      const logHandler = {info: (): void => {}, error: (): void => {}} as any;
      const configLoader = {load: async (): Promise<any> => ({configFilePath: undefined, config: {}})} as any;
      const appModuleLoader = {load: async (): Promise<any> => ({appModule: {keyname: "X"}, plugins: []})} as any;

      // eslint-disable-next-line no-new
      new InfoCommand(logHandler, cliOutput, configLoader, appModuleLoader, new CliPackageJsonResolver());

      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it("prints the resolved CLI version and completes successfully", async () => {
    const {command, lines} = buildCommand({readVersion: () => "3.0.3"});

    const exitCode = await command.run({});

    expect(exitCode).toBe(ExitCode.Success);
    expect(lines).toContain("  Version:        3.0.3");
  });

  it("degrades to an 'unknown' version without throwing when it cannot be resolved (ESM/bundled)", async () => {
    const {command, lines} = buildCommand({readVersion: () => "unknown"});

    const exitCode = await command.run({});

    expect(exitCode).toBe(ExitCode.Success);
    expect(lines).toContain("  Version:        unknown");
  });
});
