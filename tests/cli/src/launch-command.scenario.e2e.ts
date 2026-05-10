import {exec, ExecOptions} from "child_process";
import path from "path";

/**
 * End-to-end smoke tests for the `pristine` bin. Invokes the actual built bin via
 * `node_modules/.bin/pristine` (resolved through the `@pristine-ts/cli` symlink) and asserts
 * exit codes and key output strings.
 *
 * Each test runs in this package's directory, where `pristine.config.ts` points the AppModule
 * at the compiled `app.module.js` (with `SampleCommand` registered). This is the canonical
 * "did the bin actually work" gate — the unit tests in `packages/cli/src/` cover individual
 * functions, but only this suite proves that the bundled bin, the loader cascade, the
 * decorator metadata pipeline, and the command dispatcher all line up at runtime.
 */
describe("pristine bin (end-to-end)", () => {
  const cwd = path.resolve(__dirname, "..");

  /**
   * Wraps `exec` in a Promise that resolves to `{stdout, stderr, code}` instead of rejecting
   * on non-zero exit. Tests that intentionally provoke errors (e.g. missing-plugin scenarios)
   * still need to inspect stderr and the exit code, so a reject-on-error wrapper would fight us.
   */
  const run = (cmd: string, options: ExecOptions = {}): Promise<{stdout: string; stderr: string; code: number}> => {
    return new Promise((resolve) => {
      exec(cmd, {cwd, ...options}, (error, stdout, stderr) => {
        resolve({
          stdout: stdout.toString(),
          stderr: stderr.toString(),
          code: error ? (error.code as number ?? 1) : 0,
        });
      });
    });
  }

  // Each command boots the kernel, which can take a moment on a cold cache. Allow generous
  // headroom so flaky CI machines don't fail on noise.
  jest.setTimeout(30_000);

  describe("dispatching a registered command", () => {
    it("runs the user-registered SampleCommand with exit 0", async () => {
      const {stdout, code} = await run("npx pristine sample");
      expect(code).toBe(0);
      expect(stdout).toContain("should run");
      expect(stdout).toContain("[status:'Success', code:'0']");
    });
  });

  describe("built-in commands", () => {
    it("p:help lists every registered command", async () => {
      const {stdout, code} = await run("npx pristine p:help");
      expect(code).toBe(0);
      expect(stdout).toContain("Pristine CLI");
      expect(stdout).toContain("Commands:");
      // Sample of canonical names + their aliases. The exact set is asserted loosely so adding
      // new built-ins doesn't churn this test.
      expect(stdout).toContain("p:help");
      expect(stdout).toContain("p:list");
      expect(stdout).toContain("p:verify");
      expect(stdout).toContain("p:info");
      expect(stdout).toContain("p:start");
      expect(stdout).toContain("p:build");
      expect(stdout).toContain("help");
      expect(stdout).toContain("list");
      expect(stdout).toContain("sample"); // user's command
    });

    it("help (top-level alias) produces the same output", async () => {
      const {stdout, code} = await run("npx pristine help");
      expect(code).toBe(0);
      expect(stdout).toContain("Pristine CLI");
      expect(stdout).toContain("Commands:");
    });

    it("p:list prints every registered command name", async () => {
      const {stdout, code} = await run("npx pristine p:list");
      expect(code).toBe(0);
      expect(stdout).toContain("List of registered commands:");
      expect(stdout).toContain("sample");
      expect(stdout).toContain("p:help");
    });

    it("p:info prints version, runtime, and the imported module list", async () => {
      const {stdout, code} = await run("npx pristine p:info");
      expect(code).toBe(0);
      expect(stdout).toContain("Pristine CLI");
      expect(stdout).toContain("Version:");
      expect(stdout).toContain("Node:");
      expect(stdout).toContain("Platform:");
      expect(stdout).toContain("AppModule: app.cli.test");
      expect(stdout).toContain("Imported modules");
      expect(stdout).toContain("pristine.cli");
      expect(stdout).toContain("pristine.core");
    });

    it("p:config:print resolves the pristine.config.ts and shows file path + appModule", async () => {
      const {stdout, code} = await run("npx pristine p:config:print");
      expect(code).toBe(0);
      expect(stdout).toContain("Config file:");
      expect(stdout).toContain("pristine.config.ts");
      expect(stdout).toContain("appModule");
      expect(stdout).toContain("dist/lib/cjs/app.module.js");
      expect(stdout).toContain("Provenance:");
      expect(stdout).toContain("appModule: config-file");
    });

    it("p:verify boots a fresh kernel and exits 0", async () => {
      const {stdout, code} = await run("npx pristine p:verify");
      // p:verify routes its report through LogHandlerInterface, so the exact output depends
      // on which logger transport is active (console vs file vs sink). Assert only the exit
      // code and the standard CliEventHandler success line — both are stable across configs.
      expect(code).toBe(0);
      expect(stdout).toContain("Command 'p:verify' exited");
    });
  });

  describe("error handling", () => {
    it("returns non-zero exit and 'CommandNotFoundError' for unknown commands", async () => {
      const {stderr, code} = await run("npx pristine this-command-does-not-exist");
      expect(code).not.toBe(0);
      expect(stderr + "").toMatch(/this-command-does-not-exist|CommandNotFoundError/);
    });
  });
});
