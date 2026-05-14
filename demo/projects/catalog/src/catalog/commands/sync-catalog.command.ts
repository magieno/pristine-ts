import {injectable} from "tsyringe";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {CommandInterface, ConsoleManager, ExitCodeEnum} from "@pristine-ts/cli";
import {CatalogModuleKeyname} from "../catalog.module.keyname";
import {ProductService} from "../services/product.service";

/**
 * Custom CLI command. Invoke with `pristine sync-catalog`. Demonstrates:
 *   - The `@tag(ServiceDefinitionTagEnum.Command)` registration pattern
 *   - Dependency injection into commands (ConsoleManager + ProductService)
 *   - Returning an exit code so CI can branch on success/failure
 *
 * Covered in the CLI chapter.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CatalogModuleKeyname)
@injectable()
export class SyncCatalogCommand implements CommandInterface<null> {
  optionsType = null;
  name = "sync-catalog";
  description = "Re-sync the local product cache from upstream.";

  constructor(
    private readonly consoleManager: ConsoleManager,
    private readonly productService: ProductService,
  ) {
  }

  async run(): Promise<ExitCodeEnum | number> {
    const count = await this.productService.syncFromUpstream();
    this.consoleManager.writeSuccess(`Synced ${count} products.`);
    return ExitCodeEnum.Success;
  }
}
