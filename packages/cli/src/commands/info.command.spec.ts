import "reflect-metadata";
import fs from "fs";
import {ExitCode} from "@pristine-ts/common";
import {InfoCommand} from "./info.command";
import {CLI_VERSION} from "../generated/version";

/**
 * Minimal collaborators so the command can be constructed and run() driven without a live kernel.
 */
const buildCommand = (): {command: InfoCommand; lines: string[]} => {
  const lines: string[] = [];
  const cliOutput = {writeLine: (message: string): void => {lines.push(message);}} as any;
  const logHandler = {
    info: (): void => {}, error: (): void => {}, warning: (): void => {}, debug: (): void => {},
    critical: (): void => {}, notice: (): void => {}, success: (): void => {}, terminate: (): void => {},
  } as any;
  const configLoader = {load: async (): Promise<any> => ({configFilePath: undefined, config: {}})} as any;
  const appModuleLoader = {load: async (): Promise<any> => ({appModule: {keyname: "TestAppModule"}, plugins: []})} as any;

  const command = new InfoCommand(logHandler, cliOutput, configLoader, appModuleLoader);
  return {command, lines};
};

describe("InfoCommand", () => {
  it("does not read the filesystem at construction time", () => {
    // The version is a compile-time constant and the runtime banner reads only `os`/`process`, so
    // constructing the command must never touch the filesystem. A spy makes any eager read visible.
    const spy = jest.spyOn(fs, "readFileSync");
    try {
      const cliOutput = {writeLine: (): void => {}} as any;
      const logHandler = {info: (): void => {}, error: (): void => {}} as any;
      const configLoader = {load: async (): Promise<any> => ({configFilePath: undefined, config: {}})} as any;
      const appModuleLoader = {load: async (): Promise<any> => ({appModule: {keyname: "X"}, plugins: []})} as any;

      // eslint-disable-next-line no-new
      new InfoCommand(logHandler, cliOutput, configLoader, appModuleLoader);

      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it("prints the baked-in CLI version and completes successfully", async () => {
    const {command, lines} = buildCommand();

    const exitCode = await command.run({});

    expect(exitCode).toBe(ExitCode.Success);
    expect(lines).toContain(`  Version:        ${CLI_VERSION}`);
    expect(CLI_VERSION).not.toBe("unknown");
  });
});
