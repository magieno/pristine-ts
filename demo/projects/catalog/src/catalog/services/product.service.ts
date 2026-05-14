import {inject, injectable} from "tsyringe";
import {moduleScoped} from "@pristine-ts/common";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {CatalogModuleKeyname} from "../catalog.module.keyname";
import {Product} from "../models/product";

/**
 * In-memory product store used by the tutorial. A real app would back this with a database
 * or upstream API; the demo deliberately keeps the storage trivial so the chapters can
 * focus on the framework, not on persistence.
 *
 * Demonstrates:
 *   - `@injectable()` for tsyringe construction
 *   - `@moduleScoped(...)` to bind this service to `CatalogModule` (rather than registering
 *     it globally) — covered in the Modules chapter
 *   - Configuration value injection via `@inject("%key%")` — covered in the Configuration chapter
 *   - LogHandler injection — covered in the Logging chapter
 */
@injectable()
@moduleScoped(CatalogModuleKeyname)
export class ProductService {
  private readonly products: Map<string, Product> = new Map();

  constructor(
    @inject("%catalog.upstream-url%") private readonly upstreamUrl: string,
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
  ) {
    // Seed with a couple of products so a fresh `pristine start` has something to return
    // from GET /products. Real apps would load this on demand from `upstreamUrl`.
    this.products.set("peach", new Product("peach", "Peach", 250));
    this.products.set("banjo", new Product("banjo", "Banjo", 1899));
  }

  list(): Product[] {
    return [...this.products.values()];
  }

  get(id: string): Product | undefined {
    return this.products.get(id);
  }

  upsert(product: Product): Product {
    this.products.set(product.id, product);
    this.logHandler.info(`Upserted product '${product.id}' (${product.name})`);
    return product;
  }

  delete(id: string): boolean {
    return this.products.delete(id);
  }

  async syncFromUpstream(): Promise<number> {
    this.logHandler.info(`Pretending to sync from ${this.upstreamUrl}`);
    // Real sync would fetch from this.upstreamUrl and call upsert(...) per row.
    return this.products.size;
  }
}
