import {inject, injectable, injectAll} from "tsyringe";
import {moduleScoped, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {LocalSchedulingModuleKeyname} from "../local-scheduling.module.keyname";
import {LocalSchedulerInterface} from "../interfaces/local-scheduler.interface";
import {SchedulableInterface} from "../interfaces/schedulable.interface";

/**
 * Discovers every {@link SchedulableInterface} tagged {@link ServiceDefinitionTagEnum.Schedulable}
 * and registers its declared schedules into the {@link LocalSchedulerManager}.
 *
 * This discovery-and-registration step is deliberately separate from the scheduler engine so it
 * can be reused: {@link LocalSchedulerRuntimeServer} calls {@link register} on `pristine start`,
 * and any other entry point (a custom command, an embedded bootstrap) can call it the same way
 * before starting the scheduler. The scheduler itself stays a pure timer engine that knows
 * nothing about DI tags.
 *
 * Each task is registered under an id derived from its class name (suffixed `#0`, `#1`, … when it
 * declares more than one schedule). A task whose id is already registered — a collision with a
 * dynamic schedule, or a repeat call — is skipped, and a task whose `getSchedules()` throws is
 * logged and skipped; neither prevents the others from registering.
 */
@moduleScoped(LocalSchedulingModuleKeyname)
@injectable()
export class SchedulableTaskManager {
  /**
   * @param logHandler Reports skips and per-task registration failures.
   * @param scheduler The scheduler each task's schedules are registered into (by its public
   *   interface only — this class never touches the engine internals).
   * @param schedulables Every class tagged {@link ServiceDefinitionTagEnum.Schedulable}. Injected
   *   optionally, so the collection is simply empty when none is tagged. Defaults to `[]` so the
   *   class can also be constructed directly (e.g. in tests) without wiring the collection.
   */
  constructor(@inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
              @inject("LocalSchedulerInterface") private readonly scheduler: LocalSchedulerInterface,
              @injectAll(ServiceDefinitionTagEnum.Schedulable, {isOptional: true}) private readonly schedulables: SchedulableInterface[] = []) {
  }

  /**
   * Registers every tagged task's schedules into the scheduler. Safe to call more than once —
   * already-registered ids are skipped. It does not start the scheduler; the caller arms the
   * registered schedules via {@link LocalSchedulerManager.start}.
   */
  public register(): void {
    for (const schedulable of this.schedulables) {
      const name = schedulable.constructor?.name ?? "Schedulable";

      try {
        const schedules = schedulable.getSchedules();

        schedules.forEach((schedule, index) => {
          const id = schedules.length > 1 ? `${name}#${index}` : name;

          if (this.scheduler.has(id)) {
            this.logHandler.warning("SchedulableTaskManager: a tagged task's id is already registered; skipping it.", {
              extra: {id, task: name},
            });
            return;
          }

          this.scheduler.schedule(id, schedule, (eventId) => schedulable.run(eventId));
        });
      } catch (error) {
        this.logHandler.error("SchedulableTaskManager: failed to register a tagged task; skipping it.", {
          extra: {
            task: name,
            error: error instanceof Error ? (error.stack ?? error.message) : String(error),
          },
        });
      }
    }
  }
}
