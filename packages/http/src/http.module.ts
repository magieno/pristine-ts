import {ModuleInterface} from "@pristine-ts/common";
import {HttpModuleKeyname} from "./http.module.keyname";

export * from "./clients/clients";
export * from "./errors/errors";
export * from "./interfaces/interfaces"

export const HttpModule: ModuleInterface = {
    keyname: HttpModuleKeyname,
    importServices: [],
}
