import {ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {ValidationModuleKeyname} from "./validation.module.keyname";
import {NetworkingModule} from "@pristine-ts/networking";
import {CoreModule} from "@pristine-ts/core";

export * from "./decorators/decorators";
export * from "./enrichers/enrichers";

export * from "./validation.module.keyname";

export const ValidationModule: ModuleInterface = {
    keyname: ValidationModuleKeyname,
    importServices: [],
    importModules: [
        CoreModule,
        NetworkingModule,
    ],
    providerRegistrations: [
    ]
}
