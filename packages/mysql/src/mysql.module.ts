import {CommonModule, ModuleInterface} from "@pristine-ts/common";
import {
    BooleanResolver,
    ConfigurationModule,
    EnumResolver,
    EnvironmentVariableResolver, NumberResolver
} from "@pristine-ts/configuration";
import {MysqlModuleKeyname} from "./mysql.module.keyname";


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
        /**
         * Whether the mysql client will be in debug or not.
         */
        {
            parameterName: MysqlModuleKeyname + ".debug",
            defaultValue: false,
            isRequired: false,
            defaultResolvers: [
                new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_MYSQL_DEBUG")),
            ]
        },
        {
            parameterName: MysqlModuleKeyname + ".address",
            isRequired: true,
            defaultResolvers: [
                new EnvironmentVariableResolver("PRISTINE_MYSQL_ADDRESS"),
            ]
        },
        {
            parameterName: MysqlModuleKeyname + ".port",
            isRequired: false,
            defaultValue: 3306,
            defaultResolvers: [
                new NumberResolver(new EnvironmentVariableResolver("PRISTINE_MYSQL_PORT")),
            ]
        },
        {
            parameterName: MysqlModuleKeyname + ".user",
            isRequired: true,
            defaultResolvers: [
                new EnvironmentVariableResolver("PRISTINE_MYSQL_USER"),
            ]
        },
        {
            parameterName: MysqlModuleKeyname + ".password",
            isRequired: true,
            defaultResolvers: [
                new EnvironmentVariableResolver("PRISTINE_MYSQL_PASSWORD"),
            ]
        },
        {
            parameterName: MysqlModuleKeyname + ".connection_limit",
            isRequired: false,
            defaultValue: 10,
            defaultResolvers: [
                new NumberResolver(new EnvironmentVariableResolver("PRISTINE_MYSQL_CONNECTION_LIMIT")),
            ]
        },

    ],
    providerRegistrations: [
    ]
};
