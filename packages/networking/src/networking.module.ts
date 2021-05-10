import {ModuleInterface} from "@pristine-ts/common";
import {NetworkingModuleKeyname} from "./networking.module.keyname";
import {SecurityModule} from "@pristine-ts/security";

export * from "./decorators/decorators";
export * from "./enhancers/enhancers";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./interfaces/interfaces";
export * from "./models/models";
export * from "./nodes/nodes";
export * from "./resolvers/resolvers";
export * from "./utils/utils";

export * from "./router";

export const NetworkingModule: ModuleInterface = {
    keyname: NetworkingModuleKeyname,

    importServices: [],

    /**
     * This property allows you to custom register specific services. For example, you can assign a tag or use a factory
     * to instantiate a specific class.
     */
    providerRegistrations: [
    ],

    importModules: [
        SecurityModule
    ]
}
