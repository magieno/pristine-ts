import {InstantiationPhaseEnum} from "../enums/instantiation-phase.enum";
import {InstantiationStatusEnum} from "../enums/instantiation-status.enum";

/**
 * A serialized error captured when a phase throws. The original Error is not retained because the report
 * is plain data — callers may serialize it (JSON, log payload, etc.) and a thrown Error would not survive.
 */
export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
}

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
