import {CoreModule} from "@pristine-ts/core";
import {ModuleInterface} from "@pristine-ts/common";
import {HttpModule} from "@pristine-ts/common";
import {ElasticSearchModuleKeyname} from "./elastic-search.module.keyname";

// Mappers

export * from "./elastic-search.module.keyname";

export const ElasticSearchModule: ModuleInterface = {
    keyname: ElasticSearchModuleKeyname,
    importModules: [
        CoreModule,
        HttpModule,
    ]
}


