import {inject, injectable} from "tsyringe";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {RuntimeServerInterface} from "@pristine-ts/core";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {LocalSchedulingModuleKeyname} from "../local-scheduling.module.keyname";
import {LocalSchedulerInterface} from "../interfaces/local-scheduler.interface";
import {SchedulableTaskManager} from "../managers/schedulable-task.manager";

/**
 * Adapts the local scheduler to the `pristine start` lifecycle so tagged tasks run with no
 * manual bootstrap.
 *
 * It is tagged {@link ServiceDefinitionTagEnum.RuntimeServer}, so `pristine start` resolves it
 * alongside the HTTP/gRPC servers and calls `start()`, which delegates to
 * {@link SchedulableTaskManager.register} (registering every tagged {@link SchedulableInterface})
 * and then arms them via {@link LocalSchedulerManager.start}. Graceful shutdown is wired via the
 * module's `onShutdown`, which calls `stop()` to cancel timers and drain in-flight tasks.
 *
 * The register-then-start pair lives in {@link SchedulableTaskManager} and the scheduler, not
 * here, so any other entry point (a custom command, an embedded bootstrap) can reuse the exact
 * same two steps. A scheduler has no socket, so the `--port` / `--address` overrides
 * `pristine start` propagates are ignored.
 */
@tag(ServiceDefinitionTagEnum.RuntimeServer)
@moduleScoped(LocalSchedulingModuleKeyname)
@injectable()
export class LocalSchedulerRuntimeServer implements RuntimeServerInterface {
  /** Stable label for `pristine start` log lines and diagnostics. */
  public readonly name: string = "local-scheduler";

  constructor(@inject("LocalSchedulerInterface") private readonly scheduler: LocalSchedulerInterface,
              @inject(SchedulableTaskManager) private readonly schedulableTaskManager: SchedulableTaskManager,
              @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {
  }

  public async start(): Promise<void> {
    this.logHandler.info("LocalSchedulerRuntimeServer: registering tagged tasks and starting the local scheduler.");
    this.schedulableTaskManager.register();
    this.scheduler.start();
  }

  public async stop(): Promise<void> {
    this.logHandler.info("LocalSchedulerRuntimeServer: stopping the local scheduler.");
    await this.scheduler.stop();
  }
}
