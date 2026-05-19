import {inject, injectable} from "tsyringe";
import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {CommandInterface} from "@pristine-ts/cli";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {CatalogModuleKeyname} from "../catalog.module.keyname";
import {ProductService} from "../services/product.service";

/**
 * Custom CLI command. Invoke with `pristine sync-catalog`. Demonstrates:
 *   - The `@tag(ServiceDefinitionTagEnum.Command)` registration pattern
 *   - Dependency injection into commands (LogHandlerInterface + ProductService)
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
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    private readonly productService: ProductService,
  ) {
  }

  async run(): Promise<ExitCode | number> {
    const count = await this.productService.syncFromUpstream();
    this.logHandler.success("Synced products from upstream", {highlights: {count}});
    return ExitCode.Success;
  }
}
