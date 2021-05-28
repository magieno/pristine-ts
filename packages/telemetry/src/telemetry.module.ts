import {ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {TelemetryModuleKeyname} from "./telemetry.module.keyname";
import {LoggingModule} from "@pristine-ts/logging";

export * from "./enums/enums";
export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./models/models";
export * from "./tracers/basic.tracer";

export const TelemetryModule: ModuleInterface = {
    keyname: TelemetryModuleKeyname,
    importServices: [],
    importModules: [
        LoggingModule,
    ],
    providerRegistrations: [
    ]
}
