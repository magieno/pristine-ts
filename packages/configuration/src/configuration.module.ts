import {ModuleInterface} from "@pristine-ts/common";
import {ConfigurationModuleKeyname} from "./configuration.module.keyname";

export * from "./errors/errors";
export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./parsers/parsers";
export * from "./resolvers/resolvers";
export * from "./types/types";
export * from "./utils/utils";
export * from "./configuration.module.keyname";

export const ConfigurationModule: ModuleInterface = {
  keyname: ConfigurationModuleKeyname,

  importModules: [],
}
