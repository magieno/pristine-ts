import {ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {TelemetryModuleKeyname} from "./telemetry.module.keyname";

export * from "./enums/enums";
export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./models/models";

export const TelemetryModule: ModuleInterface = {
    keyname: TelemetryModuleKeyname,
    importServices: [],
    importModules: [],
    providerRegistrations: [
    ]
}
