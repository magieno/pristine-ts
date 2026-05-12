import {ModuleInterface} from "@pristine-ts/common";
import {CatalogModuleKeyname} from "./catalog.module.keyname";

/**
 * Catalog feature module. Declares the configuration parameters this feature needs and
 * lists the services that participate in DI. The actual classes (`ProductService`,
 * `ProductsController`, `SyncCatalogCommand`) self-register via their `@injectable()` and
 * `@tag(...)` decorators when the AppModule's `importServices` reaches them.
 *
 * Covered in the Modules chapter.
 */
export const CatalogModule: ModuleInterface = {
  keyname: CatalogModuleKeyname,
  configurationDefinitions: [
    {
      parameterName: `${CatalogModuleKeyname}.upstream-url`,
      isRequired: false,
      defaultValue: "https://example.com/catalog/feed",
    },
  ],
};
