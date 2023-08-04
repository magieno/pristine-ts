import {ModuleInterface} from "@pristine-ts/common";
import {LoggingModule} from "@pristine-ts/logging";
import {DataTransformerModuleKeyname} from "./data-transformer.module.keyname";
import { EnvironmentVariableResolver, NumberResolver} from "@pristine-ts/configuration";
import {DataTransformerBuilder} from "./transformers/data-transformer.builder";

export * from "./errors/errors";
export * from "./interfaces/interfaces";
export * from "./normalizers/normalizers";
export * from "./transformers/transformers";
export * from "./types/types";

export const DataTransformerModule: ModuleInterface = {
    keyname: DataTransformerModuleKeyname,
    importModules: [
        LoggingModule,
    ],
    providerRegistrations: [
    ],
    configurationDefinitions: [
    ]

}
