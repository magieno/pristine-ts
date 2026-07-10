import {ModuleInterface} from "@pristine-ts/common";
import {LoggingModule} from "@pristine-ts/logging";
import {CoreModule} from "@pristine-ts/core";
import {SchedulingModule} from "@pristine-ts/scheduling";
import {LocalSchedulingModuleKeyname} from "./local-scheduling.module.keyname";
import {LocalSchedulerRuntimeServer} from "./servers/local-scheduler.runtime-server";

export * from "./builders/builders";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./models/models";
export * from "./schedules/schedules";
export * from "./servers/servers";
export * from "./types/types";

export * from "./local-scheduling.module.keyname";

/**
 * The local-scheduling module. Import it into your application module to make
 * {@link LocalSchedulerManager} injectable and to have every {@link SchedulableInterface} you
 * tag with `@tag(ServiceDefinitionTagEnum.Schedulable)` auto-registered when the scheduler
 * starts.
 *
 * You do not have to start the scheduler yourself: {@link LocalSchedulerRuntimeServer} is
 * tagged as a {@link RuntimeServerInterface}, so `pristine start` starts it (and stops it on
 * shutdown, via `onShutdown` below) alongside the HTTP/gRPC servers. Resolve
 * {@link LocalSchedulerManager} directly only when you need the dynamic API (adding schedules
 * from a database, mutating them from controllers).
 *
 * It builds on `@pristine-ts/scheduling` — a {@link SchedulableInterface} is a
 * {@link ScheduledTaskInterface} that also declares its schedule — and is otherwise
 * platform-neutral: it depends only on core, logging, and scheduling, and registers no event
 * mappers or handlers. It coexists with `@pristine-ts/aws-scheduling` and the other scheduling
 * drivers — none of them interfere with the others.
 */
export const LocalSchedulingModule: ModuleInterface = {
  keyname: LocalSchedulingModuleKeyname,
  importModules: [
    CoreModule,
    LoggingModule,
    SchedulingModule,
  ],
  providerRegistrations: [],
  configurationDefinitions: [],
  onShutdown: async (container) => {
    try {
      // ── container.resolve, justified ────────────────────────────────────────
      // Per CLAUDE.md: module lifecycle hook. `onShutdown` is a callback fired by the
      // kernel with the container as its argument — there is no class to constructor-inject
      // into. Resolving from the provided container is the framework's intended path (the
      // same shape as HttpModule's onShutdown for KernelHttpServer).
      const runtimeServer = container.resolve(LocalSchedulerRuntimeServer);
      await runtimeServer.stop();
    } catch {
      // The scheduler may not be resolvable if the container is degraded during shutdown.
      // Swallow so other modules' onShutdown still run; stop() is idempotent anyway.
    }
  },
};
