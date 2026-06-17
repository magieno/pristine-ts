/**
 * Typed configuration keys for `@pristine-ts/mysql-cli`. Use these constants with
 * `@injectConfig` for autocomplete + rename safety, instead of typing the parameter
 * name as a string.
 *
 * ```ts
 * import {injectConfig} from "@pristine-ts/common";
 * import {MysqlCliConfigurationKeys} from "@pristine-ts/mysql-cli";
 *
 * constructor(@injectConfig(MysqlCliConfigurationKeys.ScaffoldPath) path: string) {}
 * ```
 */
export const MysqlCliConfigurationKeys = {
  ScaffoldPath: "pristine.mysql-cli.scaffold.path",
  ScaffoldBarrelPath: "pristine.mysql-cli.scaffold.barrelPath",
} as const;

export interface MysqlCliConfigurationValueMap {
  "pristine.mysql-cli.scaffold.path": string;
  /**
   * Empty string means "not set" — the command treats `""` and a real path
   * differently. `ConfigurationDefinition` does not allow `undefined` defaults,
   * so we use an empty string as the unset sentinel.
   */
  "pristine.mysql-cli.scaffold.barrelPath": string;
}

declare module "@pristine-ts/common" {
  interface PristineConfigurationValueMap extends MysqlCliConfigurationValueMap {}
}
