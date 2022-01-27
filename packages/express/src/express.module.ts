import {CoreModule} from "@pristine-ts/core";
import {ModuleInterface} from "@pristine-ts/common";
import {ExpressModuleKeyname} from "./express.module.keyname";
import {NetworkingModule} from "@pristine-ts/networking";

// Mappers
export * from "./mappers/mappers";

export * from "./express.module.keyname";

export const ExpressModule: ModuleInterface = {
    keyname: ExpressModuleKeyname,
    importModules: [
        CoreModule,
        NetworkingModule,
    ]
}


