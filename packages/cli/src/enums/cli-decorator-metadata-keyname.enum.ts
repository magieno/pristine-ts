/**
 * Metadata keynames written by `@pristine-ts/cli`'s own property/class decorators and read
 * back when resolving a command's options. Namespaced under `cli:` so they never collide
 * with the keys other Pristine decorators (validation, data-mapping, mysql, …) store on the
 * same class.
 */
export enum CliDecoratorMetadataKeynameEnum {
  CommandParameter = "cli:command-parameter",
}
