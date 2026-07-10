# SQLite Module

SQLite client for Pristine, backed by Node's built-in [`node:sqlite`](https://nodejs.org/api/sqlite.html)
module — **zero external dependencies**, in line with the framework's serverless-first philosophy.

Requires **Node.js >= 24**.

## Usage

Import the `SqliteModule` in your app module and register one `SqliteConfig` per database:

```typescript
import {SqliteModule} from "@pristine-ts/sqlite";
import {ServiceDefinitionTagEnum} from "@pristine-ts/common";

export const AppModule: AppModuleInterface = {
  keyname: "app",
  importModules: [SqliteModule],
  providerRegistrations: [
    {
      token: ServiceDefinitionTagEnum.SqliteConfig,
      useValue: {
        uniqueKeyname: "app",
        filename: "/var/data/app.db", // or ":memory:"
      },
    },
  ],
};
```

Entities use the shared `@table`/`@column` decorators from `@pristine-ts/database-common`,
which means the same entity class works with `@pristine-ts/mysql` — e.g. SQLite locally and
in unit tests, MySQL in production:

```typescript
import {column, snakeCaseColumnStrategy, camelCaseColumnStrategy, table} from "@pristine-ts/database-common";

@table({
  tableName: "users",
  autoColumnNamingStrategy: snakeCaseColumnStrategy,
  autoColumnNamingStrategyReverse: camelCaseColumnStrategy,
})
export class User {
  @column({isPrimaryKey: true})
  uniqueId: string;

  @column()
  firstName: string;
}
```

Inject the `SqliteClient` and use the same API shape as the `MysqlClient`:

```typescript
import {SearchQuery} from "@pristine-ts/database-common";

await sqliteClient.create("app", user);
const user = await sqliteClient.get("app", User, "user-1");
const results = await sqliteClient.search("app", User, new SearchQuery({query: "etienne"}));
const rows = await sqliteClient.querySql("app", "SELECT * FROM users WHERE first_name = ?", ["Etienne"]);
```

## Behavior notes

* `node:sqlite` is synchronous; the client keeps the async `MysqlClient`-shaped API for
  cross-engine symmetry, but statements execute on the event loop (the same model as
  `better-sqlite3`). This is a good fit for FaaS workloads; avoid multi-second analytical
  queries on a hot HTTP path.
* File-backed databases default to WAL journal mode and enforced foreign keys; override via
  `SqliteConfig`. `:memory:` databases skip the journal pragma.
* On AWS Lambda, file databases belong in `/tmp` (per-instance, ephemeral). Do not use WAL
  on network file systems such as EFS.
* Bound values are normalized for you: booleans become `1`/`0`, `Date` becomes an ISO-8601
  string, `undefined` becomes `NULL`.
* SQLite's `LIKE` is case-insensitive for ASCII only, which can differ subtly from MySQL
  collations in `search()`.
