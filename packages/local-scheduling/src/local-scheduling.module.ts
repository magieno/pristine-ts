import {ModuleInterface} from "@pristine-ts/common";
import {LoggingModule} from "@pristine-ts/logging";
import {CoreModule} from "@pristine-ts/core";
import {LocalSchedulingModuleKeyname} from "./local-scheduling.module.keyname";

export * from "./errors/errors";
export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./models/models";
export * from "./types/types";

export * from "./cron-scheduled-task.tag";
export * from "./local-scheduling.module.keyname";

/**
 * The local-scheduling module. Import it into your application module to make
 * {@link LocalSchedulerManager} injectable.
 *
 * It is platform-neutral: it depends only on core and logging, and it does not register any
 * event mappers or handlers. It coexists with `@pristine-ts/scheduling` and
 * `@pristine-ts/aws-scheduling` — none of them interfere with the others.
 */
export const LocalSchedulingModule: ModuleInterface = {
  keyname: LocalSchedulingModuleKeyname,
  importModules: [
    CoreModule,
    LoggingModule,
  ],
  providerRegistrations: [],
  configurationDefinitions: [],
};
