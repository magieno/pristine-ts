import {ModuleInterface} from "./interfaces/module.interface";

export const CoreModule: ModuleInterface =  {
    keyname: "pristine.core",
    importServices: [],
    importModules: [],
    providerRegistrations: [],
}

export * from "./kernel";

export * from "./enums/enums";
export * from "./errors/errors";
export * from "./interfaces/interfaces";
export * from "./types/types";
