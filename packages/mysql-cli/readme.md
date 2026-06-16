# @pristine-ts/mysql-cli

CLI commands and a TypeScript-defined migration system for `@pristine-ts/mysql`.

- Migrations are TypeScript classes implementing `MysqlMigrationInterface` — they
  bundle with your deployment artifact, so the same code runs locally and in
  production.
- Forward-only by design. There is no `down()`. Roll forward by writing a new
  migration.
- Drift detection: every applied migration is checksummed; status/verify catch
  edits made after apply.

## Install + import

```ts
// app.module.ts
import {AppModuleInterface} from "@pristine-ts/common";
import {MysqlCliModule} from "@pristine-ts/mysql-cli";
import {SqlMigrationsModule} from "./sql-migrations/sql-migrations.module";

export const AppModule: AppModuleInterface = {
  keyname: "my-app",
  importModules: [
    MysqlCliModule,
    SqlMigrationsModule,
  ],
  importServices: [],
};
```

## Writing a migration

```ts
// src/sql-migrations/01-init.sql-migrations.ts
import {injectable} from "tsyringe";
import {tag} from "@pristine-ts/common";
import {MysqlMigrationInterface} from "@pristine-ts/mysql-cli";

@tag("MysqlMigrationInterface")
@injectable()
export class Init_01 implements MysqlMigrationInterface {
  readonly name = "01-init";

  up(): string {
    return `
      CREATE TABLE users (
        id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        PRIMARY KEY (id)
      );
    `;
  }
}
```

Each migration must be importable from your AppModule's service graph. The
canonical pattern is a small "migrations module":

```ts
// src/sql-migrations/sql-migrations.module.ts
import {ModuleInterface} from "@pristine-ts/common";
// <pristine:migration-imports:start>
import {Init_01} from "./01-init.sql-migrations";
// <pristine:migration-imports:end>

export const SqlMigrationsModule: ModuleInterface = {
  keyname: "my-app.sql-migrations",
  importServices: [
    // <pristine:migration-services:start>
    Init_01,
    // <pristine:migration-services:end>
  ],
};
```

The marker comments are optional but enable `mysql:create` to auto-edit this file
when scaffolding new migrations (see `pristine.mysql-cli.scaffold.barrelPath`
below).

## Multi-database support

A migration applies to a specific database via the optional
`configUniqueKeynames` field:

```ts
export class AnalyticsBackfill_05 implements MysqlMigrationInterface {
  readonly name = "05-analytics-backfill";
  readonly configUniqueKeynames = ["analytics_db"];   // only runs against this config
  up(): string { return `...`; }
}
```

Leave the field undefined to apply against every targeted config.

## Commands

| Command | Purpose |
| --- | --- |
| `pristine mysql:migrate [--config <k>] [--dry-run] [--force]` | Apply pending migrations. Refuses to proceed on drift unless `--force`. Halts on first failure. |
| `pristine mysql:status  [--config <k>]` | Print Pending / Applied / Modified / Orphaned for every migration. Always exits 0. |
| `pristine mysql:verify  [--config <k>]` | Same scan as `status`, exits non-zero on drift. Use as a CI gate. |
| `pristine mysql:create --name <name> [--config <k>]` | Scaffold a new `<NN>-<slug>.sql-migrations.ts` file with the next sequential number. Prompts for the name when `--name` is omitted on an interactive terminal. |

`--config` defaults to `__default__`.

## State semantics

| State | Meaning |
| --- | --- |
| `Pending`  | Registered in DI, not in DB. Will run next `migrate`. |
| `Applied`  | Registered, in DB, checksums match. Nothing to do. |
| `Modified` | Registered, in DB, checksums differ. Someone edited `up()` after apply. |
| `Orphaned` | In DB, not registered. Class was deleted, or wrong config targeted. |

`apply` refuses to run when any `Modified` or `Orphaned` entries exist. Use
`--force` to override (the modified migration is NOT re-run; the orphaned record
is NOT removed — `--force` simply lets pending migrations continue).

## Configuration

Set in `pristine.config.ts`:

```ts
export default defineConfig({
  cli: { appModule: { ... }, build: { ... } },
  config: {
    "pristine.mysql-cli.scaffold.path": "src/sql-migrations",
    "pristine.mysql-cli.scaffold.barrelPath": "src/sql-migrations/sql-migrations.module.ts",
  },
});
```

| Key | Default | Meaning |
| --- | --- | --- |
| `pristine.mysql-cli.scaffold.path` | `src/sql-migrations` | Where `mysql:create` writes new files. |
| `pristine.mysql-cli.scaffold.barrelPath` | (unset) | When set, `mysql:create` auto-edits this file between marker comments. When unset, the command prints manual instructions instead. |

The bookkeeping table name comes from `MysqlConfig.migrationsTableName` (default
`pristine_migrations`).

## Bookkeeping table schema

`mysql:migrate` creates this table on demand:

```sql
CREATE TABLE IF NOT EXISTS pristine_migrations (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  filename          VARCHAR(255) NOT NULL,
  checksum          CHAR(64)     NOT NULL,
  applied_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  execution_time_ms INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_filename (filename)
);
```

`filename` stores `MysqlMigrationInterface.name` (e.g. `"01-init"`).
`checksum` is the SHA-256 of the SQL returned by `up()`, canonicalized (trailing
whitespace + CRLF normalized so trivial editor noise doesn't trigger drift).

## Running migrations in production

The same `MysqlMigrationManager.apply()` powers the CLI command — wire it up as a
one-off entry point in your deployment:

```ts
const kernel = new Kernel();
await kernel.start(AppModule);
const manager = kernel.container.resolve(MysqlMigrationManager);
const result = await manager.apply("__default__");
if (result.failedMigration !== undefined) {
  // alert + non-zero exit
}
```

Because migrations are TypeScript classes imported into the AppModule's service
graph, your bundler ships every `up()` body inside the deployment artifact — no
`.sql` files need to travel with it.

## Multiple statements per migration

The runner opens a dedicated mysql2 connection with `multipleStatements: true`
for each migration, so you can return a `;`-separated SQL string from `up()`
without doing the splitting yourself. The cached `MysqlClient` pool is not
affected — flipping `multipleStatements` on the shared pool would leak to every
other consumer, so the runner uses a one-shot connection it always closes.

## Numbering convention

Files are named `<NN>-<slug>.sql-migrations.ts`. The scaffold uses two-digit
padding by default; if you cross 99, rename the existing files to three-digit
padding once and the scaffold respects the new width going forward.

Two devs branching from `main` may both pick the same next number — git will
flag the filename collision at merge. Rename the loser on rebase.
