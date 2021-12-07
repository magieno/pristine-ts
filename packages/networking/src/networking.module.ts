import {ModuleInterface} from "@pristine-ts/common";
import {NetworkingModuleKeyname} from "./networking.module.keyname";
import {SecurityModule} from "@pristine-ts/security";

export * from "./decorators/decorators";
export * from "./enrichers/enrichers";
export * from "./errors/errors";
export * from "./interfaces/interfaces";
export * from "./models/models";
export * from "./nodes/nodes";
export * from "./resolvers/resolvers";
export * from "./utils/utils";

export * from "./router";

export const NetworkingModule: ModuleInterface = {
    keyname: NetworkingModuleKeyname,
    importModules: [
        SecurityModule
    ]
}
