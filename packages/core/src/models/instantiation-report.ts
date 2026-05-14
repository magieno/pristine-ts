import {LogHandlerInterface} from "@pristine-ts/logging";
import {InstantiationPhaseEnum} from "../enums/instantiation-phase.enum";
import {InstantiationStatusEnum} from "../enums/instantiation-status.enum";
import {PhaseResult} from "./phase-result";
import {InstantiationTestExecutionResult} from "./instantiation-test-execution-result";
import {MissingRequiredConfigurationEntry} from "./missing-required-configuration-entry";

/**
 * Aggregated outcome of `Kernel.verifyInstantiation`. Plain data — callers serialize, render, or programmatically
 * inspect it. The `log()` helper routes the report through the project's `LogHandlerInterface` (and falls back to
 * stderr only when no LogHandler is available, e.g. when module registration itself failed before logging was wired up).
 */
export class InstantiationReport {
  public phases: PhaseResult[] = [];
  public missingRequiredConfiguration: MissingRequiredConfigurationEntry[] = [];
  public instantiationTests: InstantiationTestExecutionResult[] = [];
  public totalDurationMs: number = 0;

  /**
   * LogHandler stamped onto the report by the verifier when one becomes resolvable. Optional because the
   * verifier may never reach a state where logging is available (e.g., module registration threw).
   */
  public logHandler?: LogHandlerInterface;

  /**
   * Overall status derived from phase + test outcomes. Failed if any phase failed; PassedWithWarnings if
   * there are missing required configurations satisfied only by default resolvers, or any failed instantiation
   * tests; Passed otherwise.
   */
  public get overallStatus(): InstantiationStatusEnum {
    if (this.phases.some(p => p.status === InstantiationStatusEnum.Failed)) {
      return InstantiationStatusEnum.Failed;
    }

    if (this.failedInstantiationTests.length > 0) {
      return InstantiationStatusEnum.Failed;
    }

    if (this.phases.some(p => p.status === InstantiationStatusEnum.PassedWithWarnings)) {
      return InstantiationStatusEnum.PassedWithWarnings;
    }

    return InstantiationStatusEnum.Passed;
  }

  /**
   * Convenience boolean: `true` when the report contains anything that should fail a CI check or block startup.
   * Equivalent to `overallStatus === Failed`.
   */
  public get hasErrors(): boolean {
    return this.overallStatus === InstantiationStatusEnum.Failed;
  }

  public get failedInstantiationTests(): InstantiationTestExecutionResult[] {
    return this.instantiationTests.filter(t => t.passed === false);
  }

  public get succeededInstantiationTests(): InstantiationTestExecutionResult[] {
    return this.instantiationTests.filter(t => t.passed === true);
  }

  /**
   * Routes the report through the project's logging stack. Each phase, missing configuration entry, and
   * test result is emitted as its own log entry at the appropriate severity. When no LogHandler is provided
   * and none was stamped onto the report (typical when module registration itself failed), falls back to
   * `process.stderr` so the report is never silently swallowed.
   */
  public log(logHandler?: LogHandlerInterface): void {
    const handler = logHandler ?? this.logHandler;

    if (handler === undefined) {
      this.fallbackLog();
      return;
    }

    const summary = `Kernel instantiation verification: ${this.overallStatus} (${this.totalDurationMs}ms)`;
    if (this.overallStatus === InstantiationStatusEnum.Failed) {
      handler.error(summary, {extra: {report: this.toPlainObject()}});
    } else if (this.overallStatus === InstantiationStatusEnum.PassedWithWarnings) {
      handler.warning(summary, {extra: {report: this.toPlainObject()}});
    } else {
      handler.info(summary, {extra: {report: this.toPlainObject()}});
    }

    for (const phase of this.phases) {
      const message = `Phase ${phase.phase}: ${phase.status} (${phase.durationMs}ms)` +
        (phase.error ? ` — ${phase.error.name}: ${phase.error.message}` : "");
      if (phase.status === InstantiationStatusEnum.Failed) {
        handler.error(message, {extra: {phase}});
      } else if (phase.status === InstantiationStatusEnum.PassedWithWarnings) {
        handler.warning(message, {extra: {phase}});
      } else if (phase.status === InstantiationStatusEnum.Skipped) {
        handler.info(message, {extra: {phase}});
      } else {
        handler.info(message, {extra: {phase}});
      }
    }

    for (const missing of this.missingRequiredConfiguration) {
      // Always a warning: presence of a defaultResolver does not guarantee load() will succeed (resolver
      // failures are silently swallowed), so the ConfigurationLoad phase is the source of truth for whether
      // these missing values would actually cause start() to throw.
      const message = `Required configuration not provided explicitly: '${missing.parameterName}'` +
        (missing.hasDefaultResolvers ? " (a default resolver is configured but may fail at load time)" : " (no default resolver — load will fail)");
      handler.warning(message, {extra: {missing}});
    }

    for (const test of this.instantiationTests) {
      const message = `Instantiation test '${test.name}': ${test.passed ? "passed" : "failed"} (${test.durationMs}ms)` +
        (test.message ? ` — ${test.message}` : "") +
        (test.error ? ` — ${test.error.name}: ${test.error.message}` : "");
      if (test.passed) {
        handler.info(message, {extra: {test}});
      } else {
        handler.error(message, {extra: {test}});
      }
    }
  }

  private fallbackLog(): void {
    const lines: string[] = [];
    lines.push(`Kernel instantiation verification: ${this.overallStatus} (${this.totalDurationMs}ms)`);
    for (const phase of this.phases) {
      lines.push(`  - Phase ${phase.phase}: ${phase.status} (${phase.durationMs}ms)` +
        (phase.error ? ` — ${phase.error.name}: ${phase.error.message}` : ""));
      if (phase.error?.stack) {
        lines.push(phase.error.stack.split("\n").map(l => "      " + l).join("\n"));
      }
    }
    for (const missing of this.missingRequiredConfiguration) {
      lines.push(`  - Missing required configuration: '${missing.parameterName}'` +
        (missing.hasDefaultResolvers ? " (default resolver configured)" : ""));
    }
    for (const test of this.instantiationTests) {
      lines.push(`  - Test '${test.name}': ${test.passed ? "passed" : "failed"}` +
        (test.message ? ` — ${test.message}` : ""));
    }
    process.stderr.write(lines.join("\n") + "\n");
  }

  private toPlainObject(): object {
    return {
      overallStatus: this.overallStatus,
      hasErrors: this.hasErrors,
      totalDurationMs: this.totalDurationMs,
      phases: this.phases,
      missingRequiredConfiguration: this.missingRequiredConfiguration,
      instantiationTests: this.instantiationTests,
    };
  }
}
