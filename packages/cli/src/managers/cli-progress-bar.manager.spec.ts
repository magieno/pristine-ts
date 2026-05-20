import "reflect-metadata";
import {CliProgressBar} from "./cli-progress-bar.manager";

describe("CliProgressBar", () => {
  let bar: CliProgressBar;
  let stdoutWriteSpy: jest.SpyInstance;

  beforeEach(() => {
    bar = new CliProgressBar();
    stdoutWriteSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders filled/empty segments and percentage", () => {
    bar.update(50, 100, "Halfway");
    const solid = "█".repeat(15);
    const empty = "░".repeat(15);
    expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining(`[${solid}${empty}]`));
    expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining("50%"));
    expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining("Halfway"));
  });

  it("writes a newline when the bar reaches completion", () => {
    bar.update(100, 100, "Done");
    expect(stdoutWriteSpy).toHaveBeenCalledWith("\n");
  });

  it("clamps progress values into [0, 1]", () => {
    bar.update(-10, 100);
    expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining("0%"));
    stdoutWriteSpy.mockClear();
    bar.update(200, 100);
    expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining("100%"));
  });
});
