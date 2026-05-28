import {ModuleInterface} from "@pristine-ts/common";
import {GcpModule} from "@pristine-ts/gcp";
import {GcpFunctionsModule} from "@pristine-ts/gcp-functions";
import {LoggingModule} from "@pristine-ts/logging";
import {SchedulingModule} from "@pristine-ts/scheduling";
import {GcpSchedulingModuleKeyname} from "./gcp-scheduling.module.keyname";

export * from "./event-handlers/event-handlers";
export * from "./gcp-scheduling.module.keyname";

export const GcpSchedulingModule: ModuleInterface = {
  keyname: GcpSchedulingModuleKeyname,
  configurationDefinitions: [],
  importModules: [
    GcpModule,
    GcpFunctionsModule,
    SchedulingModule,
    LoggingModule,
  ],
  providerRegistrations: [],
};
