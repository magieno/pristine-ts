import {ModuleInterface, taggedProviderRegistrationsRegistry} from "@pristine-ts/common";
import {DataMappingModuleKeyname} from "./data-mapping.module.keyname";
import {AutoDataMappingBuilder, DataMapper, StringNormalizer, NumberNormalizer, DateNormalizer} from "@pristine-ts/data-mapping-common"
import {DependencyContainer} from "tsyringe";

export * from "./decorators/decorators";
export * from "./interceptors/interceptors";

const normalizers = [
    StringNormalizer,
    NumberNormalizer,
    DateNormalizer,
]

normalizers.forEach( (normalizer: any) => {
    taggedProviderRegistrationsRegistry.push({
        constructor: normalizer,
        providerRegistration: {
            token: "DataNormalizerInterface",
            useToken: normalizer,
        },
    })
})

export const DataMappingModule: ModuleInterface = {
    keyname: DataMappingModuleKeyname,
    importModules: [
    ],
    providerRegistrations: [
        {
            token: AutoDataMappingBuilder,
            useClass: AutoDataMappingBuilder,
        },
        {
            token: DataMapper,
            useFactory: (container: DependencyContainer) => {
                return new DataMapper(container.resolve(AutoDataMappingBuilder), container.resolveAll("DataNormalizerInterface"), container.resolveAll("DataMappingInterceptorInterface"));
            }
        },
    ],
    configurationDefinitions: [
    ]

}
