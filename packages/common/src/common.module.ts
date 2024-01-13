import {CommonModuleKeyname} from "./common.module.keyname";
import {ModuleInterface} from "./interfaces/module.interface";
export * from "./constants/constants";
export * from "./contexts/contexts";
export * from "./decorators/decorators";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./models/models";
export * from "./interfaces/interfaces";
export * from "./types/types";
export * from "./utils/utils";
export * from "./common.module.keyname";

export const CommonModule: ModuleInterface =  {
    keyname: CommonModuleKeyname,
    importModules: [

    ],
    providerRegistrations: [],
}
