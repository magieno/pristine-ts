import {ModuleInterface} from "@pristine-ts/common";
import {DataMappingModuleKeyname} from "./data-mapping.module.keyname";

export * from "./builders/builders";
export * from "./decorators/decorators";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./interceptors/interceptors";
export * from "./interfaces/interfaces";
export * from "./mappers/mappers";
export * from "./nodes/nodes";
export * from "./normalizer-options/normalizer-options";
export * from "./normalizers/normalizers";
export * from "./types/types";

export const DataMappingModule: ModuleInterface = {
    keyname: DataMappingModuleKeyname,
    importModules: [
    ],
    providerRegistrations: [
    ],
    configurationDefinitions: [
    ]

}
