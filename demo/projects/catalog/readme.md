# Catalog demo

The carry-through example referenced by the Pristine Getting Started tutorial. A small
product-catalog API that demonstrates every concept introduced in chapters 10, 11, 01,
05, and 03.

This is a real, runnable Pristine project. Each tutorial chapter points at specific files
in here when teaching a concept.

## What's in here

| File | Concept it demonstrates | Chapter |
|------|------------------------|---------|
| `pristine.config.ts` | CLI configuration (sourcePath, outputPath, kernelConfiguration) | 11 (CLI) |
| `src/app.module.ts` | The root AppModule, imported modules, importServices | 01 (Overview), 05 (Modules) |
| `src/catalog/catalog.module.ts` | A feature module + configurationDefinitions | 05 (Modules), 04 (Configuration) |
| `src/catalog/models/product.ts` | Plain domain model | 03 (Controllers) |
| `src/catalog/services/product.service.ts` | `@injectable`, `@moduleScoped`, config injection, logging | 01 (Overview), 05 (Modules), 04 (Configuration), 07 (Logging) |
| `src/catalog/controllers/products.controller.ts` | `@controller`, `@route`, path params, `@bodyMapping` | 03 (Controllers) |
| `src/catalog/controllers/upsert-product.options.ts` | class-validator input shape | 03 (Controllers) |
| `src/catalog/commands/sync-catalog.command.ts` | Custom CLI command | 11 (CLI) |

## Running it locally

```sh
cd demo/projects/catalog
npm install
# One-time dedupe — see the "Why the dedupe step?" note below.
rm -rf node_modules/reflect-metadata node_modules/tsyringe \
       node_modules/@pristine-ts/*/node_modules/reflect-metadata 2>/dev/null
npm run build
npm run start
```

> **Why the dedupe step?** This demo lives inside the monorepo and depends on the local
> `@pristine-ts/*` packages via `file:` paths. npm sometimes installs a second copy of
> `reflect-metadata` inside the catalog's `node_modules/` even though the monorepo root
> already has one. Two copies = two private decorator-metadata WeakMaps = tsyringe can't
> see the decorators that the catalog's compiled code registered through the other copy.
> Removing the catalog-local copy lets Node walk up to the monorepo's shared one. For a
> standalone consumer project (outside this monorepo) this step isn't needed — npm dedupe
> handles it.

The HTTP server binds to `0.0.0.0:3000` (overridable via env var
`PRISTINE_HTTP_KERNEL_SERVER_PORT` or the `--port` flag). Once running:

```sh
curl http://localhost:3000/products
# {"products":[{"id":"peach","name":"Peach","priceCents":250},{"id":"banjo","name":"Banjo","priceCents":1899}]}

curl http://localhost:3000/products/peach
# {"id":"peach","name":"Peach","priceCents":250}

curl -X PUT http://localhost:3000/products/widget \
     -H "content-type: application/json" \
     -d '{"name":"Widget","priceCents":499}'

curl -X DELETE http://localhost:3000/products/banjo
```

Send `SIGTERM` (or `Ctrl+C`) to trigger graceful shutdown.

Run the custom command:

```sh
npm run sync-catalog
# ✔ Success: Synced 2 products.
```

Verify the app boots cleanly (useful in CI):

```sh
npm run verify
```

## Relationship to the tutorial

The chapters teach concepts incrementally — early chapters introduce a subset of these
files, later chapters extend them. The final state of every chapter is what you see here.
If you're following along, you can either:

- **Copy from scratch as you read** — each chapter shows the relevant files in full.
- **Clone this directory and edit incrementally** — the chapters call out which file to
  open at each step.

Either approach lands you at the same working app.
