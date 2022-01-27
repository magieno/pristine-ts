import {ModuleInterface} from "@pristine-ts/common";
import {LoggingModule} from "@pristine-ts/logging";
import {RedisModuleKeyname} from "./redis.module.keyname";
import { EnvironmentVariableResolver, NumberResolver} from "@pristine-ts/configuration";

export * from "./clients/clients";
export * from "./errors/errors";
export * from "./interfaces/interfaces";

export const RedisModule: ModuleInterface = {
    keyname: RedisModuleKeyname,
    importModules: [
        LoggingModule,
    ],
    providerRegistrations: [],
    configurationDefinitions: [
        /**
         * The host at which Redis is hosted.
         */
        {
            parameterName: RedisModuleKeyname + ".host",
            isRequired: true,
            defaultResolvers: [
                new EnvironmentVariableResolver("PRISTINE_REDIS_HOST"),
            ]
        },

        /**
         * The port at which Redis is hosted
         */
        {
            parameterName: RedisModuleKeyname + ".port",
            isRequired: false,
            defaultValue: 6379,
            defaultResolvers: [
                new NumberResolver(new EnvironmentVariableResolver("PRISTINE_REDIS_PORT")),
            ]
        },

        /**
         * The namespace to use when saving a key in Redis. Our keys are creating using this pattern namespace:table:key.
         */
        {
            parameterName: RedisModuleKeyname + ".namespace",
            isRequired: true,
            defaultResolvers: [
                new EnvironmentVariableResolver("PRISTINE_REDIS_NAMESPACE"),
            ]
        }
    ]

}
