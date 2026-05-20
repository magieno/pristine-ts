import {DependencyContainer, inject, injectable} from "tsyringe";
import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {CommandInterface} from "../interfaces/command.interface";
import {CliOutput} from "../managers/cli-output.manager";
import {CliModuleKeyname} from "../cli.module.keyname";

/**
 * Prints a usage banner plus a one-line summary for every registered command. The output is
 * generated from the actual `CommandInterface[]` resolved from the current DI container, so
 * newly registered (built-in or custom) commands show up automatically.
 *
 * The first column is sized to the longest command name in the set, so the second-column
 * descriptions stay aligned even when commands have wildly different name lengths.
 *
 * **Lazy command resolution.** This command is itself `@tag(Command)`, so a constructor-time
 * `@injectAll(ServiceDefinitionTagEnum.Command)` would create an infinite cycle: tsyringe
 * tries to construct HelpCommand → must inject all Commands → must construct HelpCommand →
 * recursion. We instead inject the current child container (registered by the kernel under
 * `ServiceDefinitionTagEnum.CurrentChildContainer`) and call `resolveAll` from inside `run()`,
 * by which point every Command-tagged class is fully constructed and cached.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class HelpCommand implements CommandInterface<null> {
  optionsType = null;
  name = "p:help";
  description = "Show this help message and list all registered commands.";

  constructor(
    private readonly cliOutput: CliOutput,
    @inject(ServiceDefinitionTagEnum.CurrentChildContainer) private readonly container: DependencyContainer,
  ) {
  }

  async run(args: any): Promise<ExitCode | number> {
    // ── container.resolveAll, justified ─────────────────────────────────────────
    // Per CLAUDE.md: constructor-time `@injectAll(Command)` would create a self-
    // referential cycle since `HelpCommand` is itself a `Command`-tagged service.
    // The lazy resolve breaks the cycle. The child container is constructor-
    // injected, so only the enumeration is late-bound.
    const commands: CommandInterface<any>[] = this.container.resolveAll(ServiceDefinitionTagEnum.Command);

    this.cliOutput.writeLine("Pristine CLI");
    this.cliOutput.writeLine("");
    this.cliOutput.writeLine("Usage:");
    this.cliOutput.writeLine("  pristine <command> [--option=value ...]");
    this.cliOutput.writeLine("");
    this.cliOutput.writeLine("Commands:");

    const sorted = [...commands].sort((a, b) => a.name.localeCompare(b.name));
    const longestName = sorted.reduce((max, c) => Math.max(max, c.name.length), 0);

    for (const command of sorted) {
      const padded = command.name.padEnd(longestName + 2, " ");
      const description = command.description ?? "";
      this.cliOutput.writeLine(`  ${padded}${description}`);
    }

    this.cliOutput.writeLine("");
    this.cliOutput.writeLine("Adding your own command:");
    this.cliOutput.writeLine("  1. Implement CommandInterface from '@pristine-ts/cli'");
    this.cliOutput.writeLine("  2. Decorate with @tag(ServiceDefinitionTagEnum.Command) @injectable()");
    this.cliOutput.writeLine("  3. Make sure your AppModule's import graph reaches the file");
    this.cliOutput.writeLine("  4. Invoke as: pristine <your-command-name>");

    return ExitCode.Success;
  }
}
