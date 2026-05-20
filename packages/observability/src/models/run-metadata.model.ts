/**
 * Metadata for one observability run — persisted as `run.json` at the root of a run
 * directory. A "run" is one `pristine start` lifetime, keyed by the kernel's
 * instantiation id.
 */
export class RunMetadata {
  /**
   * The run id — equal to the kernel instantiation id of the process that produced it.
   */
  runId: string;

  /**
   * ISO-8601 timestamp at which the run began.
   */
  startedAt: string;

  /**
   * ISO-8601 timestamp at which the run ended. Undefined while the run is still active.
   */
  endedAt?: string;

  /**
   * The process id that produced the run.
   */
  pid: number;

  /**
   * The CLI command that began the run (e.g. `start`).
   */
  command: string;

  constructor(runId: string, startedAt: string, pid: number, command: string) {
    this.runId = runId;
    this.startedAt = startedAt;
    this.pid = pid;
    this.command = command;
  }
}
