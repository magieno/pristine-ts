import {injectable} from "tsyringe";
import {moduleScoped, HttpMethod} from "@pristine-ts/common";
import {body, bodyMapping, controller, route, routeParameter} from "@pristine-ts/networking";
import {CatalogModuleKeyname} from "../catalog.module.keyname";
import {ProductService} from "../services/product.service";
import {UpsertProductOptions} from "./upsert-product.options";

/**
 * HTTP entrypoint for the catalog. Demonstrates:
 *   - `@controller("/products")` to declare a route prefix
 *   - `@route(method, path)` per handler
 *   - `@routeParameter("id")` to bind a path parameter to a method argument
 *   - `@body()` to bind the request body to a parameter, plus the method-level
 *     `@bodyMapping(Class)` to coerce the body into a class-validator-validated instance
 *
 * Covered in the Controllers chapter.
 */
@injectable()
@moduleScoped(CatalogModuleKeyname)
@controller("/products")
export class ProductsController {
  constructor(private readonly productService: ProductService) {
  }

  @route(HttpMethod.Get, "")
  list() {
    return {products: this.productService.list()};
  }

  @route(HttpMethod.Get, "/{id}")
  get(@routeParameter("id") id: string) {
    const product = this.productService.get(id);
    if (product === undefined) {
      return {status: 404, body: {error: `Product '${id}' not found`}};
    }
    return product;
  }

  @bodyMapping(UpsertProductOptions)
  @route(HttpMethod.Put, "/{id}")
  upsert(@routeParameter("id") id: string, @body() options: UpsertProductOptions) {
    return this.productService.upsert({
      id,
      name: options.name,
      priceCents: options.priceCents,
    });
  }

  @route(HttpMethod.Delete, "/{id}")
  delete(@routeParameter("id") id: string) {
    const removed = this.productService.delete(id);
    return {status: removed ? 204 : 404};
  }
}
