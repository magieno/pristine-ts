import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {Kernel, RuntimeServerInterface} from "@pristine-ts/core";
import {CommandInterface} from "../interfaces/command.interface";
import {ConsoleManager} from "../managers/console.manager";
import {ExitCodeEnum} from "../enums/exit-code.enum";
import {CliModuleKeyname} from "../cli.module.keyname";
import {StartCommandOptions} from "./start.command-options";

/**
 * Boots the AppModule, starts every registered `RuntimeServerInterface` (HTTP server, gRPC
 * server, etc.), and keeps the process alive until SIGTERM or SIGINT. On signal, runs the
 * registered `onShutdown` hooks via `Kernel.stop()` and exits.
 *
 * This is the production-grade entry point. Use `pristine start` (or its `pristine p:start`
 * canonical name) instead of `node dist/main.js` if you want Pristine to manage the lifecycle,
 * signal handling, and graceful shutdown — including listening on every server module the
 * AppModule imports.
 *
 * Notes:
 *   - The kernel is **already started** by `bootstrap()` before this command runs (the CLI
 *     boots once for every command). This command does not call `kernel.start()` again — it
 *     just starts the registered servers and keeps the process alive.
 *   - Servers are discovered lazily via `kernel.container.resolveAll(RuntimeServer)` rather
 *     than constructor injection. Constructor `@injectAll(RuntimeServer)` works too, but lazy
 *     resolution keeps the failure mode "no server registered" silent and clean rather than
 *     a tsyringe error during command construction.
 *   - The shutdown timeout (per `onShutdown` hook) defaults to 10 seconds. The whole-process
 *     hard exit timeout defaults to 30 seconds — if the orderly shutdown doesn't finish in
 *     that window, the process is force-exited so Kubernetes / ECS don't get stuck waiting.
 *   - `--port` / `--address` flags are propagated to every RuntimeServer's `start()`. In
 *     multi-server scenarios where servers should listen on different ports, use the per-module
 *     configuration values (e.g. `pristine.http.kernel-server.port`) instead of CLI flags.
 *   - Watch mode (`--watch`) is not yet implemented. For a dev loop, wrap `pristine start` in
 *     `nodemon` or `tsx --watch`.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class StartCommand implements CommandInterface<StartCommandOptions> {
  optionsType: StartCommandOptions = new StartCommandOptions();
  name = "p:start";
  description = "Boot the AppModule and run until SIGTERM/SIGINT. Production-grade entry point.";

  // Force-exit safeguard: if onShutdown hooks are still running after this many milliseconds
  // past the first signal, the process is killed. Prevents orchestrators from waiting on a
  // wedged shutdown.
  private static readonly HARD_EXIT_TIMEOUT_MS = 30_000;

  constructor(
    private readonly consoleManager: ConsoleManager,
    private readonly kernel: Kernel,
  ) {
  }

  async run(args: StartCommandOptions): Promise<ExitCodeEnum | number> {
    // Resolve and start every registered RuntimeServer. Lazy resolution via the kernel's
    // container — constructor `@injectAll` would error out hard if no servers were registered;
    // this path treats the empty case as "fine, nothing to start".
    const servers: RuntimeServerInterface[] = (() => {
      try {
        return this.kernel.container.resolveAll<RuntimeServerInterface>(ServiceDefinitionTagEnum.RuntimeServer);
      } catch {
        return [];
      }
    })();

    const overrides = (args.port !== undefined || args.address !== undefined)
      ? {port: args.port, address: args.address}
      : undefined;

    for (const server of servers) {
      try {
        await server.start(overrides);
      } catch (error) {
        this.consoleManager.writeError(`Failed to start server '${server.name}': ${(error as Error).message}`);
        // Best-effort: stop any servers that did start before we abort.
        for (const started of servers) {
          if (started === server) break;
          try { await started.stop(); } catch { /* swallow */ }
        }
        return ExitCodeEnum.Error;
      }
    }

    if (servers.length === 0) {
      this.consoleManager.writeSuccess("Pristine app running. Send SIGTERM (or Ctrl+C) to stop.");
    } else {
      const labels = servers.map(s => s.name).join(", ");
      this.consoleManager.writeSuccess(`Pristine app running with ${servers.length} server(s): ${labels}. Send SIGTERM (or Ctrl+C) to stop.`);
    }

    return new Promise<ExitCodeEnum | number>((resolve) => {
      let shuttingDown = false;

      // Keep the event loop alive. Without this, Node would exit as soon as it noticed nothing
      // else (no open sockets, no timers, no listening servers from user modules) was pending —
      // signal handlers alone don't count as work. The interval is a 1-day no-op heartbeat;
      // we clear it on shutdown so the process can actually exit when stop() returns.
      const heartbeat = setInterval(() => {/* no-op */}, 1 << 30);

      const initiateShutdown = async (signal: NodeJS.Signals) => {
        if (shuttingDown) {
          // Second signal arrived while we're already shutting down — escalate to an immediate
          // hard exit. This mirrors the behavior of most production runtimes (one Ctrl+C =
          // graceful, two = right now).
          this.consoleManager.writeWarning(`Received ${signal} again — forcing exit.`);
          process.exit(130);
        }
        shuttingDown = true;

        this.consoleManager.writeInfo(`Received ${signal}, shutting down gracefully...`);

        const hardExitTimer = setTimeout(() => {
          this.consoleManager.writeError(
            `Shutdown exceeded ${StartCommand.HARD_EXIT_TIMEOUT_MS}ms — forcing exit.`
          );
          process.exit(1);
        }, StartCommand.HARD_EXIT_TIMEOUT_MS);
        // Don't keep the event loop alive just for the timer.
        hardExitTimer.unref();

        try {
          // Kernel.stop() invokes module onShutdown hooks in outer-to-inner order, including
          // HttpModule.onShutdown which calls KernelHttpServer.stop(). No need to stop the
          // servers individually here.
          await this.kernel.stop();
          this.consoleManager.writeSuccess("Shutdown complete.");
          clearTimeout(hardExitTimer);
          clearInterval(heartbeat);
          resolve(ExitCodeEnum.Success);
        } catch (error) {
          this.consoleManager.writeError(`Shutdown error: ${(error as Error).message}`);
          clearTimeout(hardExitTimer);
          clearInterval(heartbeat);
          resolve(ExitCodeEnum.Error);
        }
      };

      // Register on each signal once. A second SIGINT/SIGTERM goes through `initiateShutdown`
      // again, which detects `shuttingDown` and force-exits.
      process.on("SIGTERM", () => { void initiateShutdown("SIGTERM"); });
      process.on("SIGINT", () => { void initiateShutdown("SIGINT"); });
    });
  }
}
