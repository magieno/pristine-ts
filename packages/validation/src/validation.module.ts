import {ModuleInterface} from "@pristine-ts/common";
import {ValidationModuleKeyname} from "./validation.module.keyname";
import {NetworkingModule} from "@pristine-ts/networking";
import {CoreModule} from "@pristine-ts/core";
import {Validator} from "@pristine-ts/class-validator";

export * from "./decorators/decorators";
export * from "./interceptors/interceptors";

export * from "./validation.module.keyname";

export const ValidationModule: ModuleInterface = {
  keyname: ValidationModuleKeyname,
  importModules: [
    CoreModule,
    NetworkingModule,
  ],
  providerRegistrations: [
    {
      token: Validator,
      useValue: new Validator(),
    }
  ]
}
