import {inject, injectable} from "tsyringe";
import {CommandInterface} from "@pristine-ts/cli";
import {ExitCode, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {TracingManagerInterface} from "@pristine-ts/telemetry";

/**
 * Smoke test for "CLI commands run inside an active trace, and addMarkerToCurrentSpan
 * from the command can find that trace via EventContext." If either is broken, this
 * command logs "TRACE_NOT_VISIBLE" and exits non-zero; the e2e test asserts on the
 * happy-path string.
 */
@tag(ServiceDefinitionTagEnum.Command)
@injectable()
export class TraceCheckCommand implements CommandInterface<any> {
  name: string = "trace-check";
  optionsType = null;

  constructor(@inject("TracingManagerInterface") private readonly tracingManager: TracingManagerInterface) {}

  async run(): Promise<ExitCode | number> {
    this.tracingManager.addMarkerToCurrentSpan("from-trace-check-command", {source: "cli-smoke"});
    const trail = this.tracingManager.getCurrentTrail();
    const found = trail.find(e => e.kind === "marker" && e.name === "from-trace-check-command");
    if (found === undefined) {
      console.log("TRACE_NOT_VISIBLE");
      return ExitCode.Error;
    }
    console.log("TRACE_VISIBLE");
    return ExitCode.Success;
  }
}
