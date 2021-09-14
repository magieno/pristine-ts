import {ModuleInterface} from "@pristine-ts/common";
import {NetworkingModule} from "@pristine-ts/networking";
import {CoreModuleKeyname} from "./core.module.keyname";
import {TelemetryModule} from "@pristine-ts/telemetry";
import {EventModule} from "@pristine-ts/event";
import {ConfigurationModule} from "@pristine-ts/configuration";
import {LoggingModule} from "@pristine-ts/logging";

export * from "./kernel";
export * from "./errors/errors";
export * from "./interceptors/interceptors";
export * from "./interfaces/interfaces";
export * from "./core.module.keyname";

export const CoreModule: ModuleInterface =  {
    keyname: CoreModuleKeyname,
    importModules: [
        ConfigurationModule,
        NetworkingModule,
        TelemetryModule,
        EventModule,
        LoggingModule,
    ],
    providerRegistrations: [],
}
