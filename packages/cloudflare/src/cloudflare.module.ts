import {ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {LoggingModule} from "@pristine-ts/logging";
import {BooleanResolver, EnvironmentVariableResolver} from "@pristine-ts/configuration";
import {CommonModule} from "@pristine-ts/common";
import {CloudflareModuleKeyname} from "./cloudflare.module.keyname";

export * from "./mappers/mappers";

export const CloudflareModule: ModuleInterface = {
    keyname: CloudflareModuleKeyname,
    importModules: [
        CommonModule,
        LoggingModule,
    ],
    providerRegistrations: [
    ],
    configurationDefinitions: []
}
