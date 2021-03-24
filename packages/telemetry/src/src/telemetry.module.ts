import {ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";

export * from "./managers/managers";
export * from "./models/models";

export const TelemetryModule: ModuleInterface = {
    keyname: "pristine.telemetry",
    importServices: [],
    importModules: [],
    providerRegistrations: [
    ]
}
