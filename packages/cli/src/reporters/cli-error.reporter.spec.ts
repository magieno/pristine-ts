import "reflect-metadata";
import {ExitCode, UsageError} from "@pristine-ts/common";
import {PristineEnvironment} from "@pristine-ts/core";
import {CliErrorReporter} from "./cli-error.reporter";
import {CliErrorCode} from "../errors/cli-error-code.enum";

const reporterFor = (environment: PristineEnvironment): CliErrorReporter =>
  new CliErrorReporter({getEnvironment: () => environment} as any);

describe("CliErrorReporter", () => {
  let writes: string[];
  let spy: jest.SpyInstance;

  beforeEach(() => {
    writes = [];
    spy = jest.spyOn(process.stderr, "write").mockImplementation((chunk: any) => {
      writes.push(String(chunk));
      return true;
    });
  });

  afterEach(() => spy.mockRestore());

  it("prints a plain UsageError verbatim, without the ✗ CODE envelope or details", () => {
    const reporter = reporterFor(PristineEnvironment.Production);
    const error = new UsageError("Usage: myapp x --name=<name>", {
      plain: true,
      code: CliErrorCode.MissingRequiredArgument,
      details: {missing: "name"},
    });

    const code = reporter.report(error);

    expect(writes.join("")).toBe("Usage: myapp x --name=<name>\n");
    expect(code).toBe(ExitCode.Usage);
  });

  it("prints multi-line plain messages verbatim", () => {
    const reporter = reporterFor(PristineEnvironment.Production);
    const error = new UsageError("Invalid name 'Web'. Bad.\nInvalid port '0'. Bad.", {plain: true});

    reporter.report(error);

    expect(writes.join("")).toBe("Invalid name 'Web'. Bad.\nInvalid port '0'. Bad.\n");
  });

  it("still uses the ✗ CODE envelope for non-plain user errors", () => {
    const reporter = reporterFor(PristineEnvironment.Production);

    const code = reporter.report(new UsageError("Unknown flag --foo", {code: "X_CODE"}));

    expect(writes.join("")).toContain("✗ X_CODE: Unknown flag --foo");
    expect(code).toBe(ExitCode.Usage);
  });
});
