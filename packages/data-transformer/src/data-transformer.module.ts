import {ModuleInterface} from "@pristine-ts/common";
import {LoggingModule} from "@pristine-ts/logging";
import {DataTransformerModuleKeyname} from "./data-transformer.module.keyname";
import { EnvironmentVariableResolver, NumberResolver} from "@pristine-ts/configuration";

export * from "./types/types";

export const DataTransformerModule: ModuleInterface = {
    keyname: DataTransformerModuleKeyname,
    importModules: [
        LoggingModule,
    ],
    providerRegistrations: [],
    configurationDefinitions: [
    ]

}
