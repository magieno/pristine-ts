import "reflect-metadata";
import {PristineArgv} from "./pristine-argv";

describe("PristineArgv", () => {
  it("locates the bin and extracts user args from a Node-style argv", () => {
    const argv = new PristineArgv(["/usr/bin/node", "/repo/node_modules/.bin/pristine", "build", "--watch"]);
    expect(argv.isValid).toBe(true);
    expect(argv.scriptPath).toBe("/repo/node_modules/.bin/pristine");
    expect(argv.userArgs).toEqual(["build", "--watch"]);
  });

  it("recognizes the bin under an extension (.cjs, .js, .mjs)", () => {
    const argv = new PristineArgv(["/usr/bin/node", "/usr/local/lib/node_modules/@pristine-ts/cli/dist/bin/pristine.cjs", "trace", "abc"]);
    expect(argv.isValid).toBe(true);
    expect(argv.scriptPath).toBe("/usr/local/lib/node_modules/@pristine-ts/cli/dist/bin/pristine.cjs");
    expect(argv.userArgs).toEqual(["trace", "abc"]);
  });

  it("handles the bare bin name (no leading executable, no path)", () => {
    const argv = new PristineArgv(["pristine"]);
    expect(argv.isValid).toBe(true);
    expect(argv.scriptPath).toBe("pristine");
    expect(argv.userArgs).toEqual([]);
  });

  it("scans past prefix flags that some runtimes inject between exe and script", () => {
    const argv = new PristineArgv(["bun", "--smol", "/some/path/pristine.cjs", "logs", "--follow"]);
    expect(argv.isValid).toBe(true);
    expect(argv.scriptPath).toBe("/some/path/pristine.cjs");
    expect(argv.userArgs).toEqual(["logs", "--follow"]);
  });

  it("does not treat user args that happen to be named `pristine` as the bin", () => {
    // The bin is the FIRST element whose basename is `pristine`; a later user arg
    // named `pristine` doesn't shadow it.
    const argv = new PristineArgv(["node", "/path/to/pristine.cjs", "build", "--name", "pristine"]);
    expect(argv.scriptPath).toBe("/path/to/pristine.cjs");
    expect(argv.userArgs).toEqual(["build", "--name", "pristine"]);
  });

  it("reports invalid when no element matches the bin name", () => {
    const argv = new PristineArgv(["node", "/some/other/script.js", "build"]);
    expect(argv.isValid).toBe(false);
    expect(argv.scriptPath).toBe("");
    expect(argv.userArgs).toEqual([]);
  });

  it("ignores non-string elements while scanning", () => {
    const argv = new PristineArgv(["node", 42, null, "/path/to/pristine", "repl"]);
    expect(argv.isValid).toBe(true);
    expect(argv.scriptPath).toBe("/path/to/pristine");
    expect(argv.userArgs).toEqual(["repl"]);
  });
});
