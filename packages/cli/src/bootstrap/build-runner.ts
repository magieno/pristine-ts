import {injectable} from "tsyringe";
import {spawnSync} from "child_process";

/**
 * Runs `pristine p:build` as a subprocess of the currently-running bin. Used by
 * `AppModuleLoader` when the user accepts the "rebuild now?" prompt — re-running the build
 * inline avoids the awkward "exit, ask the user to type a command, re-enter" loop.
 *
 * Spawning rather than dispatching to `BuildCommand` directly keeps `AppModuleLoader` free
 * of the build pipeline's dependency graph (LogHandler, ShellManager, CliOutput, etc.) which only
 * exists in the kernel container — and the kernel hasn't booted yet at the point this is
 * called. The subprocess re-bootstraps the kernel cleanly with all of those services.
 *
 * Returns `true` on a successful build (exit code 0), `false` on any failure or signal.
 */
@injectable()
export class BuildRunner {
  private readonly buildCommandName: string = "p:build";

  run(): boolean {
    // process.argv[1] is the absolute path to the running bin file (set by Node when the
    // bin was invoked). Re-spawning the same bin guarantees we use the exact same CLI
    // version + setup the user is currently running against — no risk of resolving a
    // different `pristine` from PATH that doesn't match this process's expectations.
    const result = spawnSync(process.execPath, [process.argv[1], this.buildCommandName], {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    return result.status === 0;
  }
}
