import {ModuleInterface} from "@pristine-ts/common";
import {NetworkingModule} from "@pristine-ts/networking";
import {SecurityModuleKeyname} from "./security.module.keyname";

export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./security.module.keyname";

export const SecurityModule: ModuleInterface = {
    keyname: SecurityModuleKeyname,
    importServices: [],
    importModules: [
        NetworkingModule,
    ],
    providerRegistrations: []
}
