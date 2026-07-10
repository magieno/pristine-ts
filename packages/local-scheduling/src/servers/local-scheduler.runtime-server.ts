import {inject, injectable} from "tsyringe";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {RuntimeServerInterface} from "@pristine-ts/core";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {LocalSchedulingModuleKeyname} from "../local-scheduling.module.keyname";
import {LocalSchedulerInterface} from "../interfaces/local-scheduler.interface";

/**
 * Adapts {@link LocalSchedulerManager} to the `pristine start` lifecycle so tagged tasks run
 * with no manual bootstrap.
 *
 * It is tagged {@link ServiceDefinitionTagEnum.RuntimeServer}, so `pristine start` resolves it
 * alongside the HTTP/gRPC servers and calls `start()` — which registers every tagged
 * {@link SchedulableInterface} and arms its timers. Graceful shutdown is wired via the
 * module's `onShutdown`, which calls `stop()` to cancel timers and drain in-flight tasks.
 *
 * A scheduler has no socket, so the `--port` / `--address` overrides `pristine start`
 * propagates are ignored.
 */
@tag(ServiceDefinitionTagEnum.RuntimeServer)
@moduleScoped(LocalSchedulingModuleKeyname)
@injectable()
export class LocalSchedulerRuntimeServer implements RuntimeServerInterface {
  /** Stable label for `pristine start` log lines and diagnostics. */
  public readonly name: string = "local-scheduler";

  constructor(@inject("LocalSchedulerInterface") private readonly scheduler: LocalSchedulerInterface,
              @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {
  }

  public async start(): Promise<void> {
    this.logHandler.info("LocalSchedulerRuntimeServer: starting the local scheduler.");
    this.scheduler.start();
  }

  public async stop(): Promise<void> {
    this.logHandler.info("LocalSchedulerRuntimeServer: stopping the local scheduler.");
    await this.scheduler.stop();
  }
}
