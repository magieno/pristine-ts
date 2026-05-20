import "reflect-metadata";
import {CliOutput} from "./cli-output.manager";

describe("CliOutput", () => {
  let cliOutput: CliOutput;
  let stdoutWriteSpy: jest.SpyInstance;
  let consoleTableSpy: jest.SpyInstance;

  beforeEach(() => {
    cliOutput = new CliOutput();
    stdoutWriteSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    consoleTableSpy = jest.spyOn(console, "table").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("write writes to stdout without a newline", () => {
    cliOutput.write("hello");
    expect(stdoutWriteSpy).toHaveBeenCalledWith("hello");
  });

  it("writeLine writes to stdout with a newline", () => {
    cliOutput.writeLine("hello");
    expect(stdoutWriteSpy).toHaveBeenCalledWith("hello\n");
  });

  it("writeTable delegates to console.table", () => {
    const rows = [{id: 1, name: "row"}];
    cliOutput.writeTable(rows);
    expect(consoleTableSpy).toHaveBeenCalledWith(rows);
  });
});
