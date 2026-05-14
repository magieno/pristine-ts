import {AppModuleInterface} from "@pristine-ts/common";
import {CoreModule} from "@pristine-ts/core";
import {HttpModule} from "@pristine-ts/http";
import {NetworkingModule} from "@pristine-ts/networking";
import {AppModuleKeyname} from "./app.module.keyname";
import {CatalogModule} from "./catalog/catalog.module";
import {ProductService} from "./catalog/services/product.service";
import {ProductsController} from "./catalog/controllers/products.controller";
import {SyncCatalogCommand} from "./catalog/commands/sync-catalog.command";

/**
 * Root module the CLI loads via `pristine.config.ts` → `appModule.outputPath`. Imports
 * the framework modules our app uses (CoreModule for everything, HttpModule so
 * `pristine start` auto-launches an HTTP server, NetworkingModule for the controller
 * routing pipeline) plus our own CatalogModule.
 *
 * `importServices` lists every class the AppModule wants registered with the kernel
 * container — they self-register via their @injectable/@tag decorators when the import
 * graph reaches them.
 */
export const AppModule: AppModuleInterface = {
  keyname: AppModuleKeyname,
  importModules: [
    CoreModule,
    HttpModule,
    NetworkingModule,
    CatalogModule,
  ],
  importServices: [
    ProductService,
    ProductsController,
    SyncCatalogCommand,
  ],
};
