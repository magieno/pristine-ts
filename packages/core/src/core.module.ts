import {ModuleInterface} from "@pristine-ts/common";
import {NetworkingModule} from "@pristine-ts/networking";
import {CoreModuleKeyname} from "./core.module.keyname";
import {TelemetryModule} from "@pristine-ts/telemetry";
import {EventModule} from "@pristine-ts/event";

export const CoreModule: ModuleInterface =  {
    keyname: CoreModuleKeyname,
    importServices: [],
    importModules: [
        NetworkingModule,
        TelemetryModule,
        EventModule,
    ],
    providerRegistrations: [],
}

export * from "./kernel";

export * from "./enums/enums";
export * from "./errors/errors";
export * from "./interceptors/interceptors";
export * from "./interfaces/interfaces";
export * from "./core.module.keyname";
