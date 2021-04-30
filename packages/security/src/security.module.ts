import {ModuleInterface} from "@pristine-ts/common";
import {NetworkingModule} from "@pristine-ts/networking";

export * from "./interfaces/interfaces";
export * from "./managers/managers";

export const SecurityModule: ModuleInterface = {
    keyname: "pristine.security",
    importServices: [],
    importModules: [
        NetworkingModule,
    ],
    providerRegistrations: []
}
