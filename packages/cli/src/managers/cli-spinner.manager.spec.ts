import "reflect-metadata";
import {CliSpinner} from "./cli-spinner.manager";
import {LogHandlerInterface} from "@pristine-ts/logging";

describe("CliSpinner", () => {
  let spinner: CliSpinner;
  let logHandler: jest.Mocked<LogHandlerInterface>;
  let stdoutWriteSpy: jest.SpyInstance;

  beforeEach(() => {
    logHandler = {
      critical: jest.fn(), error: jest.fn(), warning: jest.fn(),
      notice: jest.fn(), info: jest.fn(), success: jest.fn(),
      debug: jest.fn(), terminate: jest.fn(),
    };
    spinner = new CliSpinner(logHandler);
    stdoutWriteSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("start hides the cursor and renders frames", () => {
    spinner.start("Loading...");
    expect(stdoutWriteSpy).toHaveBeenCalledWith("\x1B[?25l");
    jest.advanceTimersByTime(100);
    expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining("Loading..."));
  });

  it("stop restores the cursor and routes success message through logHandler.success", () => {
    spinner.start("Loading...");
    spinner.stop("Done!", true);
    expect(stdoutWriteSpy).toHaveBeenCalledWith("\x1B[?25h");
    expect(logHandler.success).toHaveBeenCalledWith("Done!");
    expect(logHandler.error).not.toHaveBeenCalled();
  });

  it("stop routes failure message through logHandler.error when success=false", () => {
    spinner.start("Loading...");
    spinner.stop("Failed!", false);
    expect(logHandler.error).toHaveBeenCalledWith("Failed!");
    expect(logHandler.success).not.toHaveBeenCalled();
  });

  it("stop without a message emits no log", () => {
    spinner.start("Loading...");
    spinner.stop();
    expect(logHandler.success).not.toHaveBeenCalled();
    expect(logHandler.error).not.toHaveBeenCalled();
  });

  it("start is a no-op when already spinning", () => {
    spinner.start("first");
    stdoutWriteSpy.mockClear();
    spinner.start("second");
    expect(stdoutWriteSpy).not.toHaveBeenCalled();
  });
});
