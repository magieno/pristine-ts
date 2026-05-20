import * as readline from "node:readline";
import {injectable} from "tsyringe";
import {ExitCode, moduleScoped, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {ObservabilityStoreReader} from "@pristine-ts/observability";
import {CommandInterface} from "../interfaces/command.interface";
import {CommandEventMapper} from "../mappers/command-event.mapper";
import {CommandArgumentResolver} from "../services/command-argument-resolver";
import {CliOutput} from "./cli-output.manager";
import {CliModuleKeyname} from "../cli.module.keyname";

/**
 * The interactive `pristine` console — launched when the bin is invoked with no command
 * (or `pristine repl`). It keeps the kernel booted for the whole session, so every
 * command runs instantly with no per-invocation boot cost.
 *
 * Slash-prefixed commands map onto the same `CommandInterface` registry the one-shot bin
 * uses (`/logs`, `/trace`, `/build`, custom user commands), plus the session verbs
 * `/help`, `/clear`, `/exit`. Tab-completion is driven by the live command registry, and
 * by recent trace ids for `/trace` / `/logs`.
 *
 * Dispatch deliberately bypasses `CliEventHandler` (which calls `process.exit` after a
 * command) — the REPL must survive each command and return to the prompt.
 */
@injectable()
@moduleScoped(CliModuleKeyname)
export class ReplSession {
  private static readonly PROMPT = "pristine ❯ ";
  private static readonly SESSION_VERBS = ["/help", "/clear", "/exit"];
  private static readonly TRACE_ID_COMPLETION_LIMIT = 25;

  private commands: CommandInterface<any>[] = [];

  constructor(
    private readonly kernel: Kernel,
    private readonly cliOutput: CliOutput,
    private readonly commandEventMapper: CommandEventMapper,
    private readonly commandArgumentResolver: CommandArgumentResolver,
    private readonly storeReader: ObservabilityStoreReader,
  ) {
  }

  /**
   * Runs the read-eval-print loop until `/exit` or EOF (Ctrl-D). Resolves with the exit
   * code the bin should return.
   */
  async start(): Promise<number> {
    this.commands = this.resolveCommands();
    this.printBanner();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: ReplSession.PROMPT,
      completer: (line: string) => this.complete(line),
    });

    return new Promise<number>((resolve) => {
      rl.prompt();

      rl.on("line", (line: string) => {
        const trimmed = line.trim();
        if (trimmed.length === 0) {
          rl.prompt();
          return;
        }

        // Pause input while a command runs so its own SIGINT handling (e.g. `logs -f`)
        // owns Ctrl-C, and so a second line can't interleave mid-dispatch.
        rl.pause();
        void this.handleLine(trimmed).then((shouldExit) => {
          if (shouldExit) {
            rl.close();
            return;
          }
          rl.resume();
          rl.prompt();
        });
      });

      // Ctrl-C at an idle prompt clears the line rather than killing the session.
      rl.on("SIGINT", () => {
        this.cliOutput.writeLine("(type /exit to quit)");
        rl.prompt();
      });

      rl.on("close", () => {
        void this.shutdown().then(() => resolve(ExitCode.Success));
      });
    });
  }

  /**
   * Handles one input line. Returns true when the session should end.
   */
  private async handleLine(input: string): Promise<boolean> {
    const withoutSlash = input.startsWith("/") ? input.slice(1) : input;
    const tokens = withoutSlash.split(/\s+/).filter(token => token.length > 0);
    const name = tokens[0];
    const rest = tokens.slice(1);

    if (name === "exit" || name === "quit") {
      return true;
    }
    if (name === "clear") {
      console.clear();
      return false;
    }
    if (name === "help") {
      this.printHelp();
      return false;
    }

    const command = this.findCommand(name);
    if (command === undefined) {
      this.cliOutput.writeLine(`Unknown command '${name}'. Type /help for the list.`);
      return false;
    }

    try {
      // Reuse the one-shot argv parser by feeding it a synthetic argv, so flags behave
      // identically in the REPL and on the command line.
      const mapped = this.commandEventMapper.map(
        ["node", "repl", command.name, ...rest],
        {keyname: ExecutionContextKeynameEnum.Cli, context: null},
      );
      const args = await this.commandArgumentResolver.resolve(command, mapped.events[0].payload.arguments);
      await command.run(args);
    } catch (error) {
      this.cliOutput.writeLine(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return false;
  }

  /**
   * Resolves a command by its name or alias (`logs` matches `logs`; `trace` matches
   * `p:trace` too).
   */
  private findCommand(name: string): CommandInterface<any> | undefined {
    return this.commands.find(command => command.name === name || command.name === `p:${name}`);
  }

  /**
   * Readline completer. Completes `/`-prefixed command names and session verbs; for
   * `/trace` and `/logs` it completes the trailing token with recent trace ids.
   */
  private complete(line: string): [string[], string] {
    const traceIdMatch = /^\/(trace|logs)\s+(\S*)$/.exec(line);
    if (traceIdMatch !== null) {
      const partial = traceIdMatch[2];
      const hits = this.storeReader.recentTraceIds(ReplSession.TRACE_ID_COMPLETION_LIMIT)
        .filter(id => id.startsWith(partial));
      return [hits, partial];
    }

    const candidates = [
      ...this.commands.map(command => `/${command.name}`),
      ...ReplSession.SESSION_VERBS,
    ];
    const hits = candidates.filter(candidate => candidate.startsWith(line));
    return [hits.length > 0 ? hits : candidates, line];
  }

  private printBanner(): void {
    this.cliOutput.writeLine("Pristine — interactive console");
    this.cliOutput.writeLine("Type /help for commands, /exit to quit.");
    this.cliOutput.writeLine("");
  }

  private printHelp(): void {
    this.cliOutput.writeLine("Session:");
    this.cliOutput.writeLine("  /help            show this message");
    this.cliOutput.writeLine("  /clear           clear the screen");
    this.cliOutput.writeLine("  /exit            leave the console");
    this.cliOutput.writeLine("");
    this.cliOutput.writeLine("Commands (also runnable as `pristine <name>`):");
    const sorted = [...this.commands].sort((a, b) => a.name.localeCompare(b.name));
    const longest = sorted.reduce((max, command) => Math.max(max, command.name.length), 0);
    for (const command of sorted) {
      const padded = `/${command.name}`.padEnd(longest + 3, " ");
      this.cliOutput.writeLine(`  ${padded}${command.description ?? ""}`);
    }
  }

  private async shutdown(): Promise<void> {
    try {
      await this.kernel.stop();
    } catch {
      // Best-effort — we're leaving the process anyway.
    }
  }

  /**
   * Enumerates every registered command.
   *
   * Resolved from a dedicated child container with the `CurrentChildContainer` token
   * registered — some commands (`HelpCommand`, `ListCommand`) inject that token, which
   * only the kernel's per-event child containers carry. The one-shot path gets it for
   * free because `CliEventHandler` runs inside such a child container; the REPL builds an
   * equivalent one once for the whole session.
   *
   * `resolveAll`, justified: this is framework REPL infrastructure resolved at session
   * start, mirroring `Cli.warnOnCommandCollisions`. Enumerating every `Command`-tagged
   * service is inherently a container-introspection operation with no constructor seam.
   */
  private resolveCommands(): CommandInterface<any>[] {
    try {
      const childContainer = this.kernel.container.createChildContainer();
      childContainer.registerInstance(ServiceDefinitionTagEnum.CurrentChildContainer, childContainer);
      return childContainer.resolveAll<CommandInterface<any>>(ServiceDefinitionTagEnum.Command);
    } catch (error) {
      process.stderr.write(`[repl] could not load commands: ${error instanceof Error ? error.message : String(error)}\n`);
      return [];
    }
  }
}
