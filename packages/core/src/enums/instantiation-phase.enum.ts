/**
 * Distinct phases of `Kernel.start()`. `verifyInstantiation` runs each phase in order on a fresh kernel
 * and reports the outcome of each independently so callers can pinpoint which phase failed.
 */
export enum InstantiationPhaseEnum {
  ModuleRegistration = "ModuleRegistration",
  ConfigurationCheck = "ConfigurationCheck",
  ConfigurationLoad = "ConfigurationLoad",
  ServiceTagRegistration = "ServiceTagRegistration",
  AfterInit = "AfterInit",
  BootProbe = "BootProbe",
  InstantiationTests = "InstantiationTests",
}
