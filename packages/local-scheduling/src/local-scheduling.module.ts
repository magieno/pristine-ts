import {ModuleInterface} from "@pristine-ts/common";
import {LoggingModule} from "@pristine-ts/logging";
import {CoreModule} from "@pristine-ts/core";
import {SchedulingModule} from "@pristine-ts/scheduling";
import {LocalSchedulingModuleKeyname} from "./local-scheduling.module.keyname";

export * from "./errors/errors";
export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./models/models";
export * from "./schedules/schedules";
export * from "./types/types";

export * from "./schedulable.tag";
export * from "./local-scheduling.module.keyname";

/**
 * The local-scheduling module. Import it into your application module to make
 * {@link LocalSchedulerManager} injectable and to have every {@link SchedulableInterface} you
 * tag with `@tag(SchedulableTag)` auto-registered when the scheduler starts.
 *
 * It builds on `@pristine-ts/scheduling` — a {@link SchedulableInterface} is a
 * {@link ScheduledTaskInterface} that also declares its schedule — and is otherwise
 * platform-neutral: it depends only on core, logging, and scheduling, and it registers no
 * event mappers or handlers. It coexists with `@pristine-ts/aws-scheduling` and the other
 * scheduling drivers — none of them interfere with the others.
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
};
