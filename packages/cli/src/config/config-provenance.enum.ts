/**
 * Where a resolved configuration value originated. Used by `pristine p:config:print` to
 * annotate output so users can tell whether a value comes from their config file, a
 * deprecated `package.json` field, or the CLI's built-in defaults.
 */
export enum ConfigProvenanceEnum {
  ConfigFile = "config-file",
  PackageJsonDeprecated = "package-json-deprecated",
  Default = "default",
}
