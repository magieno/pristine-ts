import {CommonModule, ModuleInterface} from "@pristine-ts/common";
import {FileModuleKeyname} from "./file.module.keyname";

export * from "./enums/enums";
export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./options/options";

export const FileModule: ModuleInterface = {
    keyname: FileModuleKeyname,
    configurationDefinitions: [
    ],
    importModules: [
        CommonModule,
    ],
}