import {ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {TelemetryModuleKeyname} from "./telemetry.module.keyname";
import {LoggingModule} from "@pristine-ts/logging";
import {BooleanResolver, EnvironmentVariableResolver} from "@pristine-ts/configuration";
import {CommonModule} from "@pristine-ts/common";

export * from "./enums/enums";
export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./models/models";
export * from "./tracers/basic.tracer";

export const TelemetryModule: ModuleInterface = {
    keyname: TelemetryModuleKeyname,
    importModules: [
        CommonModule,
        LoggingModule,
    ],
    providerRegistrations: [
    ],
    configurationDefinitions: [{
        parameterName: TelemetryModuleKeyname + ".active",
        defaultValue: true,
        isRequired: false,
        defaultResolvers: [
            new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_TRACING_IS_ACTIVE")),
        ]
    },
        {
        parameterName: TelemetryModuleKeyname + ".debug",
        defaultValue: false,
        isRequired: false,
        defaultResolvers: [
            new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_TRACING_DEBUG")),
        ]
    }]
}
