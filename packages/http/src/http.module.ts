import {ModuleInterface} from "@pristine-ts/common";
import {HttpModuleKeyname} from "./http.module.keyname";
import {LoggingModule} from "@pristine-ts/logging";

export * from "./clients/clients";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./interceptors/interceptors"
export * from "./interfaces/interfaces"
export * from "./options/options";
export * from "./utils/utils";

export const HttpModule: ModuleInterface = {
    keyname: HttpModuleKeyname,
    importModules: [LoggingModule],
    configurationDefinitions: [
    ],
}
