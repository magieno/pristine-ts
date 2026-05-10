import {injectable} from "tsyringe";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {Kernel} from "@pristine-ts/core";
import {CommandInterface} from "../interfaces/command.interface";
import {ConsoleManager} from "../managers/console.manager";
import {ExitCodeEnum} from "../enums/exit-code.enum";
import {CliModuleKeyname} from "../cli.module.keyname";

/**
 * Prints a usage banner plus a one-line summary for every registered command. The output is
 * generated from the actual `CommandInterface[]` resolved from the kernel's container, so
 * newly registered (built-in or custom) commands show up automatically.
 *
 * The first column is sized to the longest command name in the set, so the second-column
 * descriptions stay aligned even when commands have wildly different name lengths.
 *
 * **Lazy command resolution.** This command is itself `@tag(Command)`, so a constructor-time
 * `@injectAll(ServiceDefinitionTagEnum.Command)` would create an infinite cycle: tsyringe
 * tries to construct HelpCommand → must inject all Commands → must construct HelpCommand →
 * recursion. We instead inject the running `Kernel` (registered as an instance after
 * `kernel.start()` in `cli.ts`) and call `kernel.container.resolveAll` from inside `run()`,
 * by which time every Command-tagged class is fully constructed and cached.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class HelpCommand implements CommandInterface<null> {
  optionsType = null;
  name = "p:help";
  description = "Show this help message and list all registered commands.";

  constructor(
    private readonly consoleManager: ConsoleManager,
    private readonly kernel: Kernel,
  ) {
  }

  async run(args: any): Promise<ExitCodeEnum | number> {
    const commands: CommandInterface<any>[] = this.kernel.container.resolveAll(ServiceDefinitionTagEnum.Command);
    this.consoleManager.writeLine("Pristine CLI");
    this.consoleManager.writeLine("");
    this.consoleManager.writeLine("Usage:");
    this.consoleManager.writeLine("  pristine <command> [--option=value ...]");
    this.consoleManager.writeLine("");
    this.consoleManager.writeLine("Commands:");

    // Aliases share the same delegate but appear as distinct command rows under both names.
    const sorted = [...commands].sort((a, b) => a.name.localeCompare(b.name));

    const longestName = sorted.reduce((max, c) => Math.max(max, c.name.length), 0);

    for (const command of sorted) {
      const padded = command.name.padEnd(longestName + 2, " ");
      const description = command.description ?? "";
      this.consoleManager.writeLine(`  ${padded}${description}`);
    }

    this.consoleManager.writeLine("");
    this.consoleManager.writeLine("Adding your own command:");
    this.consoleManager.writeLine("  1. Implement CommandInterface from '@pristine-ts/cli'");
    this.consoleManager.writeLine("  2. Decorate with @tag(ServiceDefinitionTagEnum.Command) @injectable()");
    this.consoleManager.writeLine("  3. Make sure your AppModule's import graph reaches the file");
    this.consoleManager.writeLine("  4. Invoke as: pristine <your-command-name>");

    return ExitCodeEnum.Success;
  }
}
