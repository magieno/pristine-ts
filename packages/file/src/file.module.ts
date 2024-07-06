import {CommonModule, ModuleInterface} from "@pristine-ts/common";
import {FileModuleKeyname} from "./file.module.keyname";
import {DataMappingModule} from "@pristine-ts/data-mapping";

export * from "./enums/enums";
export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./options/options";
export * from "./resolvers/resolvers";

export const FileModule: ModuleInterface = {
    keyname: FileModuleKeyname,
    configurationDefinitions: [
    ],
    importModules: [
        CommonModule,
        DataMappingModule,
    ],
}