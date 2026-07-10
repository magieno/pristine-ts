# Database Common Module

Shared, engine-agnostic relational database primitives used by the database modules
(`@pristine-ts/mysql`, `@pristine-ts/sqlite`):

* The `@table` and `@column` entity decorators and their metadata interfaces.
* The column naming strategies (`snakeCaseColumnStrategy`, `camelCaseColumnStrategy`).
* The search models (`SearchQuery`, `SearchResult`, `SearchQueryField`, `SearchFieldFilter`)
  and their enums (`FilteringOperatorEnum`, `SortOrderEnum`).

Because the decorators live here, an entity class decorated once with `@table`/`@column`
can be used with any of the database clients — for example SQLite locally and MySQL in
production.
