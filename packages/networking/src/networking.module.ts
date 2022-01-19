import {ModuleInterface} from "@pristine-ts/common";
import {NetworkingModuleKeyname} from "./networking.module.keyname";
import {SecurityModule} from "@pristine-ts/security";
import {TelemetryModule} from "@pristine-ts/telemetry";
import {BooleanResolver, EnvironmentVariableResolver} from "@pristine-ts/configuration";

export * from "./decorators/decorators";
export * from "./errors/errors";
export * from "./handlers/handlers";
export * from "./interceptors/interceptors";
export * from "./interfaces/interfaces";
export * from "./mappers/mappers";
export * from "./models/models";
export * from "./nodes/nodes";
export * from "./resolvers/resolvers";
export * from "./utils/utils";

export * from "./router";

export const NetworkingModule: ModuleInterface = {
    keyname: NetworkingModuleKeyname,
    importModules: [
        SecurityModule,
        TelemetryModule,
    ],
    configurationDefinitions: [
        {
            parameterName: NetworkingModuleKeyname + ".request_body_converter.is_active",
            isRequired: false,
            defaultValue: true,
            defaultResolvers: [
                new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_NETWORKING_REQUEST_BODY_CONVERTER_IS_ACTIVE")),
            ],
        }
    ],
}
