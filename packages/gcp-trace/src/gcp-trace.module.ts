import {ModuleInterface} from "@pristine-ts/common";
import {TelemetryModule} from "@pristine-ts/telemetry";
import {LoggingModule} from "@pristine-ts/logging";
import {BooleanResolver, EnvironmentVariableResolver} from "@pristine-ts/configuration";
import {GcpTraceModuleKeyname} from "./gcp-trace.module.keyname";

export * from "./tracers/tracers";

export * from "./gcp-trace.module.keyname";
export * from "./gcp-trace.configuration-keys";

export const GcpTraceModule: ModuleInterface = {
  keyname: GcpTraceModuleKeyname,
  configurationDefinitions: [
    {
      parameterName: GcpTraceModuleKeyname + ".debug",
      defaultValue: false,
      isRequired: false,
      defaultResolvers: [
        new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_GCP_TRACE_DEBUG")),
      ],
    },
    /**
     * Whether the Cloud Trace tracer should actually export traces. **Default `false`** —
     * importing `@pristine-ts/gcp-trace` is not enough on its own to start exporting;
     * you must explicitly opt in by setting this to `true` (or
     * `PRISTINE_GCP_TRACE_ACTIVATED=true`).
     *
     * The tracer is always constructed when the package is in the import graph (it has
     * to be — the constructor wires up the stream listener the framework pushes traces
     * into). When `activated === false`, the listener early-returns instead of touching
     * the Cloud Trace exporter. No spans are sent, no GCP credentials are required.
     */
    {
      parameterName: GcpTraceModuleKeyname + ".activated",
      defaultValue: false,
      isRequired: false,
      defaultResolvers: [
        new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_GCP_TRACE_ACTIVATED")),
      ],
    },
    /**
     * The GCP project id to ship traces to. Falls back to `GOOGLE_CLOUD_PROJECT`.
     */
    {
      parameterName: GcpTraceModuleKeyname + ".projectId",
      isRequired: false,
      defaultValue: "",
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_GCP_TRACE_PROJECT_ID"),
        new EnvironmentVariableResolver("GOOGLE_CLOUD_PROJECT"),
      ],
    },
  ],
  importModules: [
    TelemetryModule,
    LoggingModule,
  ],
  providerRegistrations: [],
};
