/**
 * Why a candidate file was considered a possible AppModule. Used by the disambiguation prompt
 * so the user sees "(matches app.module.*)" vs "(exports AppModule)" alongside each option.
 */
export enum AppModuleDiscoveryReasonEnum {
  /** The filename matches `app.module.{js,mjs,cjs}`. Highest confidence. */
  Named = "named",
  /** The filename is `*.module.{js,mjs,cjs}` and the file's exports include an `AppModule` symbol. */
  Exports = "exports",
}
