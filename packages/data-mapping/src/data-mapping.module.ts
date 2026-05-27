import {ModuleInterface, taggedProviderRegistrationsRegistry} from "@pristine-ts/common";
import {DataMappingModuleKeyname} from "./data-mapping.module.keyname";
import {
  AutoDataMappingBuilder,
  BooleanNormalizer,
  DataMapper,
  DataMappingInterceptorInterface,
  DataNormalizerInterface,
  DateNormalizer,
  LowercaseNormalizer,
  NumberNormalizer,
  StringNormalizer
} from "@pristine-ts/data-mapping-common"
import {DependencyContainer} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";

// To facilitate things, this module should re-export everything. Therefore, no one else needs to know that we have two
// modules unless you specifically just want the raw classes (like in the frontend).
export * from "@pristine-ts/data-mapping-common";

// The built-in normalizers don't carry the `@tag` decorator themselves (they live in
// data-mapping-common, which we want to keep frontend-friendly and decorator-light), so we
// register them against the framework's tag registry from here at module load. The kernel
// reads this registry during bootstrap to expose them via `resolveAll("DataNormalizerInterface")`.
const normalizers = [
  StringNormalizer,
  NumberNormalizer,
  DateNormalizer,
  BooleanNormalizer,
  LowercaseNormalizer,
];

normalizers.forEach((normalizer: any) => {
  taggedProviderRegistrationsRegistry.push({
    constructor: normalizer,
    providerRegistration: {
      token: "DataNormalizerInterface",
      useToken: normalizer,
    },
  });
});

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
        // Interceptors are optional. Use `isRegistered` rather than relying on a
        // placeholder no-op interceptor: tsyringe's `resolveAll` throws when no
        // providers are registered, so we guard the call ourselves.
        const interceptors = container.isRegistered("DataMappingInterceptorInterface", true)
          ? container.resolveAll<DataMappingInterceptorInterface>("DataMappingInterceptorInterface")
          : [];

        // Adapter: data-mapping-common takes a plain callback so it can be used in
        // frontend bundles without pulling @pristine-ts/logging. Here on the backend we
        // bridge that callback to the framework's standard LogHandlerInterface so reports
        // flow through LogStore / Sentry / whatever the project has configured.
        const logHandler = container.resolve<LogHandlerInterface>("LogHandlerInterface");

        return new DataMapper(
          container.resolve(AutoDataMappingBuilder),
          container.resolveAll<DataNormalizerInterface<any, any>>("DataNormalizerInterface"),
          interceptors,
          (error, context) => logHandler.error("DataMapper.autoMap caught an error.", {error, ...context}),
        );
      }
    },
  ],
  configurationDefinitions: []
}
