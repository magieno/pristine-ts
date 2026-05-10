import {ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {CommandInterface} from "./interfaces/command.interface";
import {loadAppModule} from "./bootstrap/app-module-loader";

/**
 * Boots the CLI: discovers the consumer's AppModule, starts the kernel, and dispatches
 * `process.argv` to whichever command matches. Exported so `bin.ts` can call it explicitly
 * — the auto-invoke at module load was removed so library consumers importing this file for
 * its types or `bootstrap` reference do not accidentally trigger an entire kernel boot.
 */
export const bootstrap = async (): Promise<void> => {
  const {appModule, configuration} = await loadAppModule();

  const kernel = new Kernel();
  await kernel.start(appModule, configuration);

  // Make the running kernel resolvable from within commands so things like `pristine start`
  // can register signal handlers and call `kernel.stop()` for graceful shutdown.
  kernel.container.registerInstance(Kernel, kernel);

  warnOnCommandCollisions(kernel);

  await kernel.handle(process.argv, {keyname: ExecutionContextKeynameEnum.Cli, context: null});
}

/**
 * Walks every registered Command-tagged service and warns to stderr if multiple share a `name`.
 * The CLI's event dispatcher picks whichever match it sees first — without this warning, a
 * plugin silently shadowing a built-in command (or two plugins shadowing each other) would
 * be invisible until someone debugged "why is my command not running?". Warning rather than
 * throwing keeps the bin runnable; users decide whether to fix the conflict.
 */
const warnOnCommandCollisions = (kernel: Kernel): void => {
  let commands: CommandInterface<any>[];
  try {
    commands = kernel.container.resolveAll<CommandInterface<any>>(ServiceDefinitionTagEnum.Command);
  } catch {
    return;
  }

  const byName = new Map<string, number>();
  for (const command of commands) {
    byName.set(command.name, (byName.get(command.name) ?? 0) + 1);
  }

  for (const [name, count] of byName.entries()) {
    if (count > 1) {
      process.stderr.write(
        `[pristine] WARNING: command '${name}' is registered ${count} times. Only the first match will be dispatched.\n`
      );
    }
  }
}
