import {ModuleInterface} from "@pristine-ts/common";
import {NetworkingModule} from "@pristine-ts/networking";
import {JwtModuleKeyname} from "./jwt.module.keyname";
import {EnvironmentVariableResolver} from "@pristine-ts/configuration";

export * from "./decorators/decorators";
export * from "./errors/errors";
export * from "./guards/guards";
export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./resolvers/resolvers";
export * from "./jwt.module.keyname";

export const JwtModule: ModuleInterface = {
  keyname: JwtModuleKeyname,
  configurationDefinitions: [
    {
      parameterName: JwtModuleKeyname + ".algorithm",
      isRequired: false,
      defaultValue: "HS256",
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_JWT_ALGORITHM"),
      ]
    },
    {
      parameterName: JwtModuleKeyname + ".publicKey",
      isRequired: true,
    },
    {
      parameterName: JwtModuleKeyname + ".privateKey",
      isRequired: false,
      defaultValue: "",
    },
    {
      parameterName: JwtModuleKeyname + ".passphrase",
      isRequired: false,
      defaultValue: "",
    },
  ],
  importModules: [
    NetworkingModule,
  ]
}
