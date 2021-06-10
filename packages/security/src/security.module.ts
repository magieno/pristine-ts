import {ModuleInterface} from "@pristine-ts/common";
import {SecurityModuleKeyname} from "./security.module.keyname";
import {LoggingModule} from "@pristine-ts/logging";

export * from "./decorators/decorators";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./factories/factories";
export * from "./guards/guards";
export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./security.module.keyname";

export const SecurityModule: ModuleInterface = {
    keyname: SecurityModuleKeyname,
    importModules: [
        LoggingModule,
    ],
    providerRegistrations: []
}
