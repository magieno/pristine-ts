import * as fs from "fs";
import {Readable} from "stream";
import {injectable, singleton} from "tsyringe";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {LoggerInterface, LogModel} from "@pristine-ts/logging";
import {ObservabilityModuleKeyname} from "../observability.module.keyname";
import {ObservabilityConfiguration} from "../observability-configuration";
import {ObservabilityRunManager} from "../store/observability-run-manager";

/**
 * A `Logger` transport that appends every log entry, as one JSON object per line, to the
 * active run's `logs.jsonl`. This is what makes `pristine logs` possible.
 *
 * Unlike the framework's `ConsoleLogger`/`FileLogger`, this logger does **not** extend
 * `BaseLogger`: the store must capture *every* log at full fidelity — no severity
 * threshold, no stacking, no depth truncation beyond a safety bound. Filtering happens at
 * query time, not write time.
 *
 * Dormant until a run is begun: `isActive()` returns false until `ObservabilityRunManager`
 * reports an active run, so `LogHandler` skips this transport entirely for one-shot CLI
 * commands.
 */
@moduleScoped(ObservabilityModuleKeyname)
@singleton()
@tag(ServiceDefinitionTagEnum.Logger)
@injectable()
export class ObservabilityLogger implements LoggerInterface {
  public readonly readableStream: Readable;

  constructor(
    private readonly configuration: ObservabilityConfiguration,
    private readonly runManager: ObservabilityRunManager,
  ) {
    this.readableStream = new Readable({
      objectMode: true,
      read(_size: number) { return true; },
    });

    this.readableStream.on("data", (log: LogModel) => {
      try {
        this.capture(log);
      } catch (error) {
        this.reportFailure(error);
      }
    });

    this.readableStream.on("error", (error) => {
      this.reportFailure(error);
    });
  }

  isActive(): boolean {
    return this.configuration.enabled && this.runManager.isRunActive();
  }

  terminate(): void {
    this.readableStream.destroy();
  }

  private capture(log: LogModel): void {
    const logsFile = this.runManager.logsFile();
    if (logsFile === undefined) {
      return;
    }

    // Store the faithful LogModel — `severity` stays a numeric `SeverityEnum`, `date` a
    // Date → ISO string — so the `logs` command can round-trip it back through
    // `PrettyLogFormatter`. Serialized cycle-safe: `log.extra` routinely holds Span/Trace
    // objects whose `parentSpan` ↔ `children` back-references would make a naive
    // depth-bounded copy explode combinatorially.
    const line = ObservabilityLogger.safeStringify(log) + "\n";
    fs.appendFileSync(logsFile, line);
    this.runManager.recordBytesWritten(Buffer.byteLength(line));
  }

  /**
   * `JSON.stringify` with a cycle guard — an object seen earlier in the walk is rendered
   * as `"[Circular]"` rather than recursed into. Faithful at any depth, and immune to the
   * `Span.parentSpan` ↔ `Span.children` cycles common in `log.extra`.
   */
  private static safeStringify(value: unknown): string {
    const seen = new WeakSet<object>();
    return JSON.stringify(value, (_key, val) => {
      if (typeof val === "object" && val !== null) {
        if (seen.has(val)) {
          return "[Circular]";
        }
        seen.add(val);
      }
      return val;
    });
  }

  private reportFailure(error: unknown): void {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    try {
      process.stderr.write(`[pristine][observability-logger] ${message}\n`);
    } catch {
      // If stderr is unwritable too, there is nothing useful left to do.
    }
  }
}
