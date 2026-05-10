import {InstantiationPhaseEnum} from "../enums/instantiation-phase.enum";
import {InstantiationStatusEnum} from "../enums/instantiation-status.enum";
import {SerializedError} from "../interfaces/serialized-error.interface";

/**
 * Outcome of a single phase of `Kernel.verifyInstantiation` (e.g. `ModuleRegistration`,
 * `ConfigurationLoad`, `BootProbe`). One `PhaseResult` per phase appears in the report.
 */
export class PhaseResult {
  constructor(
    public readonly phase: InstantiationPhaseEnum,
    public status: InstantiationStatusEnum,
    public durationMs: number,
    public error?: SerializedError,
    public details?: any,
  ) {
  }
}
