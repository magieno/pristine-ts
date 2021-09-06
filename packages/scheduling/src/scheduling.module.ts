import {ModuleInterface} from "@pristine-ts/common";
import {LoggingModule} from "@pristine-ts/logging";
import {SchedulingModuleKeyname} from "./scheduling.module.keyname";

export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./tasks/tasks";

export const SchedulingModule: ModuleInterface = {
    keyname: SchedulingModuleKeyname,
    importModules: [
        LoggingModule,
    ],
    providerRegistrations: [],
    configurationDefinitions: [

    ]

}
