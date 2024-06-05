import {CommonModule, ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {
    BooleanResolver,
    ConfigurationModule,
    EnumResolver,
    EnvironmentVariableResolver, NumberResolver
} from "@pristine-ts/configuration";
import {MysqlModuleKeyname} from "./mysql.module.keyname";
import {MysqlConfig} from "./configs/mysql.config";


export * from "./clients/clients";
export * from "./decorators/decorators";
export * from "./enums/enums";
export * from "./interfaces/interfaces";
export * from "./strategies/strategies";
export * from "./types/types";

export * from "./mysql.module.keyname";

export const MysqlModule: ModuleInterface = {
    keyname: MysqlModuleKeyname,
    importModules: [
        CommonModule,
        ConfigurationModule,
    ],
    configurationDefinitions: [
    ],
    providerRegistrations: [
        {
            token: ServiceDefinitionTagEnum.MysqlConfig,
            useValue: new MysqlConfig("default", "", 0, "", "", 0, false, "")
        }
    ]
};
