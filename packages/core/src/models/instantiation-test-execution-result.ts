import {SerializedError} from "./phase-result";

export class InstantiationTestExecutionResult {
  constructor(
    public readonly name: string,
    public readonly passed: boolean,
    public readonly durationMs: number,
    public readonly description?: string,
    public readonly message?: string,
    public readonly details?: any,
    public readonly error?: SerializedError,
  ) {
  }
}
