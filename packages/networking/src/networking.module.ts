import {ModuleInterface} from "@pristine-ts/common";
import {NetworkingModuleKeyname} from "./networking.module.keyname";
import {SecurityModule} from "@pristine-ts/security";
import {TelemetryModule} from "@pristine-ts/telemetry";
import {BooleanResolver, EnvironmentVariableResolver} from "@pristine-ts/configuration";
import {LoggingModule} from "@pristine-ts/logging";
import {DataMappingModule} from "@pristine-ts/data-mapping";

export * from "./cache/cache";
export * from "./decorators/decorators";
export * from "./enums/enums";
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
        LoggingModule,
        SecurityModule,
        TelemetryModule,
        DataMappingModule,
    ],
    configurationDefinitions: [
        /**
         * Whether or not the request body converter interceptor is active.
         */
        {
            parameterName: NetworkingModuleKeyname + ".requestBodyConverter.isActive",
            isRequired: false,
            defaultValue: true,
            defaultResolvers: [
                new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_NETWORKING_REQUEST_BODY_CONVERTER_IS_ACTIVE")),
            ],
        },

        /**
         * Whether or not the default content type response header interceptor is active.
         */
        {
            parameterName: NetworkingModuleKeyname + ".defaultContentTypeResponseHeader.isActive",
            isRequired: false,
            defaultValue: true,
            defaultResolvers: [
                new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_NETWORKING_DEFAULT_CONTENT_TYPE_RESPONSE_HEADER_IS_ACTIVE")),
            ],
        },

        /**
         * The default Content-Type response header to set on responses that do not already have Content-Types.
         */
        {
            parameterName: NetworkingModuleKeyname + ".defaultContentTypeResponseHeader",
            isRequired: false,
            defaultValue: "application/json",
            defaultResolvers: [
                new EnvironmentVariableResolver("PRISTINE_NETWORKING_DEFAULT_CONTENT_TYPE_RESPONSE_HEADER"),
            ],
        },

        /**
         * Activates or deactivates whether the Router Cache is on or off.
         */
        {
            parameterName: NetworkingModuleKeyname + ".routerCache.isActive",
            isRequired: false,
            defaultValue: false,
            defaultResolvers: [
                new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_NETWORKING_ROUTER_CACHE_IS_ACTIVE")),
            ],
        }
    ],
}
