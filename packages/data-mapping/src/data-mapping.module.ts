import {ModuleInterface, taggedProviderRegistrationsRegistry} from "@pristine-ts/common";
import {DataMappingModuleKeyname} from "./data-mapping.module.keyname";
import {
  AutoDataMappingBuilder,
  BooleanNormalizer,
  DataMapper,
  DateNormalizer,
  LowercaseNormalizer,
  NumberNormalizer,
  StringNormalizer
} from "@pristine-ts/data-mapping-common"
import {DependencyContainer} from "tsyringe";

export * from "./interceptors/interceptors";

// To facilitate things, this module should re-export everything. Therefore, no one else needs to know that we have two
// modules unless you specifically just want the raw classes (like in the frontend).
export * from "@pristine-ts/data-mapping-common";

const normalizers = [
  StringNormalizer,
  NumberNormalizer,
  DateNormalizer,
  BooleanNormalizer,
  LowercaseNormalizer,
]

normalizers.forEach((normalizer: any) => {
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
  importModules: [],
  providerRegistrations: [
    {
      token: AutoDataMappingBuilder,
      useClass: AutoDataMappingBuilder,
    },
    {
      token: DataMapper,
      // ── container.resolve / container.resolveAll, justified ───────────────────
      // Per CLAUDE.md: a `useFactory` provider IS the framework's intended factory
      // path. The factory receives the container as its only argument; resolving
      // the DataMapper's dependencies through it is how DI factories work in
      // tsyringe. There's no class to constructor-inject into.
      useFactory: (container: DependencyContainer) => {
        return new DataMapper(container.resolve(AutoDataMappingBuilder), container.resolveAll("DataNormalizerInterface"), container.resolveAll("DataMappingInterceptorInterface"));
      }
    },
  ],
  configurationDefinitions: []

}
