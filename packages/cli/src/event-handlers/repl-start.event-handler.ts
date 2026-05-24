import * as readline from "node:readline";
import {inject, injectable} from "tsyringe";
import {Event, EventHandlerInterface, ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {ExitCode, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {ObservabilityStoreReader} from "@pristine-ts/observability";
import {CommandInterface} from "../interfaces/command.interface";
import {CliOutput} from "../managers/cli-output.manager";
import {CliModuleKeyname} from "../cli.module.keyname";
import {StartReplEventPayload} from "../event-payloads/start-repl.event-payload";
import {StartReplEventResponse} from "../types/start-repl-event-response.type";

/**
 * The interactive `pristine` console, modelled as a long-running event handler. Launched
 * when the bin is invoked with no command (or `pristine repl`) — `ReplStartEventMapper`
 * produces a `StartReplEventPayload` and this handler runs the readline loop for the rest
 * of the process lifetime.
 *
 * **Why an event handler.** The REPL is the same shape as `pristine start` (or any
 * long-running command): an EventHandler whose `handle()` doesn't return until the
 * session ends. This gives the CLI bootstrap a uniform shape — `cli.ts` just calls
 * `kernel.handle(argv, {keyname: Cli})` regardless of whether the user invoked a one-shot
 * command or wants the interactive console. There is no driver/handler asymmetry left in
 * the bootstrap; the mapping layer routes argv to the right payload.
 *
 * **Per-line dispatch.** Each typed line is re-entered through `kernel.handle(...,
 * {keyname: Cli})` — using `Kernel` (the proper re-entry seam — it owns trace lifecycle,
 * child container creation, the works). The `Kernel` is `registerInstance`-d into its
 * own container by `Cli.bootstrap()`, so this handler injects it via DI like any other
 * service.
 *
 * Plus the session verbs `/help`, `/clear`, `/exit` handled in-process (they're not
 * commands — they don't re-enter the kernel). Tab-completion is driven by the live
 * command registry and by recent trace ids for `/trace` / `/logs`.
 */
@tag(ServiceDefinitionTagEnum.EventHandler)
@moduleScoped(CliModuleKeyname)
@injectable()
export class ReplStartEventHandler implements EventHandlerInterface<StartReplEventPayload, ExitCode | number> {
  private static readonly PROMPT = "pristine ❯ ";
  private static readonly SESSION_VERBS = ["/help", "/clear", "/exit"];
  private static readonly TRACE_ID_COMPLETION_LIMIT = 25;

  private commands: CommandInterface<any>[] = [];

  constructor(
    @inject(Kernel) private readonly kernel: Kernel,
    private readonly cliOutput: CliOutput,
    private readonly storeReader: ObservabilityStoreReader,
  ) {
  }

  supports<T>(event: Event<T>): boolean {
    return event.payload instanceof StartReplEventPayload;
  }

  /**
   * Runs the read-eval-print loop until `/exit` or EOF (Ctrl-D). Resolves with the exit
   * code wrapped in a `StartReplEventResponse`; the mapper surfaces that to `Cli.bootstrap`.
   */
  async handle(event: Event<StartReplEventPayload>): Promise<StartReplEventResponse> {
    this.commands = this.resolveCommands();
    this.printBanner();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: ReplStartEventHandler.PROMPT,
      completer: (line: string) => this.complete(line),
    });

    const exitCode = await new Promise<ExitCode | number>((resolve) => {
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

    return new StartReplEventResponse(event, exitCode);
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

    try {
      // Re-enter the kernel with a synthetic argv under the `Cli` keyname — parsing and
      // dispatch are identical to a one-shot invocation. `CliEventHandler` returns the
      // exit code instead of calling `process.exit`, so the loop survives. An unknown
      // command throws `CommandNotFoundError`, caught below.
      await this.kernel.handle(
        ["node", "repl", name, ...rest],
        {keyname: ExecutionContextKeynameEnum.Cli, context: null},
      );
    } catch (error) {
      this.cliOutput.writeLine(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return false;
  }

  /**
   * Readline completer. Completes `/`-prefixed command names and session verbs; for
   * `/trace` and `/logs` it completes the trailing token with recent trace ids.
   */
  private complete(line: string): [string[], string] {
    const traceIdMatch = /^\/(trace|logs)\s+(\S*)$/.exec(line);
    if (traceIdMatch !== null) {
      const partial = traceIdMatch[2];
      const hits = this.storeReader.recentTraceIds(ReplStartEventHandler.TRACE_ID_COMPLETION_LIMIT)
        .filter(id => id.startsWith(partial));
      return [hits, partial];
    }

    const candidates = [
      ...this.commands.map(command => `/${command.name}`),
      ...ReplStartEventHandler.SESSION_VERBS,
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
   * only the kernel's per-event child containers carry. Each REPL-typed line dispatched
   * via `kernel.handle` gets its own per-event child container automatically; this
   * banner-time enumeration builds an equivalent one once for the session completer.
   *
   * `resolveAll`, justified: framework REPL infrastructure resolved at session start —
   * enumerating every `Command`-tagged service is inherently a container-introspection
   * operation with no constructor seam.
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
