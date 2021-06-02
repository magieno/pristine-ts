import {ModuleInterface} from "@pristine-ts/common";
import {LoggingModule} from "@pristine-ts/logging";
import {RedisModuleKeyname} from "./redis.module.keyname";

export const RedisModule: ModuleInterface = {
    keyname: RedisModuleKeyname,
    importModules: [
        LoggingModule,
    ],
    providerRegistrations: []
}
