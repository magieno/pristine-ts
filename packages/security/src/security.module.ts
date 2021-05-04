import {ModuleInterface} from "@pristine-ts/common";
import {SecurityModuleKeyname} from "./security.module.keyname";
import {LoggingModule} from "@pristine-ts/logging";

export * from "./decorators/decorators";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./security.module.keyname";

export const SecurityModule: ModuleInterface = {
    keyname: SecurityModuleKeyname,
    importServices: [],
    importModules: [
        LoggingModule,
    ],
    providerRegistrations: []
}
