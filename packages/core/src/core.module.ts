import {ModuleInterface} from "./interfaces/module.interface";

export const CoreModule: ModuleInterface =  {
    keyname: "pristine.core",
    importServices: [],
    importModules: [],
    providerRegistrations: [],
}

export * from "./kernel";

export * from "./configurations/configurations";
export * from "./decorators/decorators";
export * from "./enums/enums";
export * from "./errors/errors";
// export * from "./factories/factories";
export * from "./interfaces/interfaces";
export * from "./models/models";
export * from "./network/network";
export * from "./nodes/nodes";
export * from "./parsers/parsers";
export * from "./resolvers/resolvers";
export * from "./types/types";
export * from "./utils/utils";