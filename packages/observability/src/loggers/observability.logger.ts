import {Readable} from "stream";
import {injectable, singleton} from "tsyringe";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {LoggerInterface, LogModel} from "@pristine-ts/logging";
import {ObservabilityModuleKeyname} from "../observability.module.keyname";
import {LogStore} from "../store/log-store";

/**
 * A `Logger` transport that forwards every log entry to `LogStore`. Thin adapter — all
 * file I/O, serialization, retention, and per-process partitioning live in `LogStore`.
 *
 * Unlike the framework's `ConsoleLogger`/`FileLogger`, this transport does **not** extend
 * `BaseLogger`: the store captures *every* log at full fidelity — no severity threshold,
 * no stacking, no depth truncation beyond a safety bound. Filtering happens at query
 * time, not write time.
 */
@moduleScoped(ObservabilityModuleKeyname)
@singleton()
@tag(ServiceDefinitionTagEnum.Logger)
@injectable()
export class ObservabilityLogger implements LoggerInterface {
  public readonly readableStream: Readable;

  constructor(private readonly logStore: LogStore) {
    this.readableStream = new Readable({
      objectMode: true,
      read(_size: number) { return true; },
    });

    this.readableStream.on("data", (log: LogModel) => {
      try {
        this.logStore.append(log);
      } catch (error) {
        this.reportFailure(error);
      }
    });

    this.readableStream.on("error", (error) => {
      this.reportFailure(error);
    });
  }

  isActive(): boolean {
    return this.logStore.isCaptureEnabled();
  }

  terminate(): void {
    this.readableStream.destroy();
  }

  private reportFailure(error: unknown): void {
    try {
      // Stringification happens inside the guard — `error.name`/`error.message`/`String(error)`
      // can all throw on pathological inputs (throwing getters, exotic `Symbol.toPrimitive`,
      // etc.). The safety net must not become the new failure source.
      const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      process.stderr.write(`[pristine][observability-logger] ${message}\n`);
    } catch {
      // If even stringifying or writing fails, there is nothing useful left to do.
    }
  }
}
