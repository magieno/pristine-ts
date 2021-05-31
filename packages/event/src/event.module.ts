import {ModuleInterface} from "@pristine-ts/common";
import {NetworkingModule} from "@pristine-ts/networking";
import {TelemetryModule} from "@pristine-ts/telemetry";
import {EventModuleKeyname} from "./event.module.keyname";
import {LoggingModule} from "@pristine-ts/logging";

export * from "./dispatchers/dispatchers";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./interfaces/interfaces";
export * from "./models/models";
export * from "./transformers/transformers";
export * from "./event.module.keyname";

export const EventModule: ModuleInterface =  {
    keyname: EventModuleKeyname,
    importModules: [
        NetworkingModule,
        TelemetryModule,
        LoggingModule,
    ],
    providerRegistrations: [],
}
