import {ModuleInterface} from "@pristine-ts/common";
import {NetworkingModule} from "@pristine-ts/networking";

export const CoreModule: ModuleInterface =  {
    keyname: "pristine.core",
    importServices: [],
    importModules: [
        NetworkingModule
    ],
    providerRegistrations: [],
}

export * from "./kernel";

export * from "./errors/errors";
export * from "./interfaces/interfaces";
