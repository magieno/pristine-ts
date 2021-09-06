import {ModuleInterface} from "@pristine-ts/common";
import {LoggingModule} from "@pristine-ts/logging";
import {SchedulingModuleKeyname} from "./scheduling.module.keyname";
import {EventModule} from "@pristine-ts/event";

export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./tasks/tasks";

export const SchedulingModule: ModuleInterface = {
    keyname: SchedulingModuleKeyname,
    importModules: [
        LoggingModule,
        EventModule,
    ],
    providerRegistrations: [],
    configurationDefinitions: [

    ]

}
