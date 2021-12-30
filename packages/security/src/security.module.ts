import {ModuleInterface} from "@pristine-ts/common";
import {SecurityModuleKeyname} from "./security.module.keyname";
import {LoggingModule} from "@pristine-ts/logging";
import {EnvironmentVariableResolver} from "@pristine-ts/configuration";
import {TelemetryModule} from "@pristine-ts/telemetry";

export * from "./decorators/decorators";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./factories/factories";
export * from "./guards/guards";
export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./providers/providers";
export * from "./security.module.keyname";

export const SecurityModule: ModuleInterface = {
    keyname: SecurityModuleKeyname,
    importModules: [
        LoggingModule,
        TelemetryModule,
    ],
    providerRegistrations: [],
    configurationDefinitions: [
        {
            parameterName: SecurityModuleKeyname + ".rolesClaimKey",
            isRequired: false,
            defaultValue: "roles",
            defaultResolvers: [
                new EnvironmentVariableResolver("PRISTINE_SECURITY_ROLES_CLAIM_KEY"),
            ]
        }
    ]

}
