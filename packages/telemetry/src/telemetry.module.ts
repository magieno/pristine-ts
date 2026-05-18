import {CommonModule, ModuleInterface} from "@pristine-ts/common";
import {TelemetryModuleKeyname} from "./telemetry.module.keyname";
import {LoggingModule} from "@pristine-ts/logging";
import {BooleanResolver, EnumResolver, EnvironmentVariableResolver, NumberResolver} from "@pristine-ts/configuration";
import {ConsoleTracerOutputModeEnum} from "./enums/console-tracer-output-mode.enum";

export * from "./enums/enums";
export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./models/models";
export * from "./tracers/tracers";
export * from "./utils/utils";

export * from "./telemetry.configuration-keys";
export const TelemetryModule: ModuleInterface = {
  keyname: TelemetryModuleKeyname,
  importModules: [
    CommonModule,
    LoggingModule,
  ],
  providerRegistrations: [],
  configurationDefinitions: [
    /**
     * Whether or not tracing is activated.
     */
    {
      parameterName: TelemetryModuleKeyname + ".active",
      defaultValue: true,
      isRequired: false,
      defaultResolvers: [
        new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_TRACING_IS_ACTIVE")),
      ]
    },
    /**
     * Whether or not tracing is in debug mode, meaning that it should output logs with the debug severity about the trace and spans.
     * This can be set to false to prevent having to much logs for every single span created.
     */
    {
      parameterName: TelemetryModuleKeyname + ".debug",
      defaultValue: false,
      isRequired: false,
      defaultResolvers: [
        new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_TRACING_DEBUG")),
      ]
    },
    /**
     * Whether `ConsoleTracer` should print completed traces to stdout. Off by default —
     * when on, every trace whose duration exceeds `console-tracer.minimum-duration-ms`
     * is rendered. Best for local development; in production prefer a real backend.
     */
    {
      parameterName: TelemetryModuleKeyname + ".console-tracer.activated",
      defaultValue: false,
      isRequired: false,
      defaultResolvers: [
        new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_TELEMETRY_CONSOLE_TRACER_ACTIVATED")),
      ]
    },
    /**
     * Output format for `ConsoleTracer`. See `ConsoleTracerOutputModeEnum`.
     */
    {
      parameterName: TelemetryModuleKeyname + ".console-tracer.output-mode",
      defaultValue: ConsoleTracerOutputModeEnum.Tree,
      isRequired: false,
      defaultResolvers: [
        new EnumResolver(new EnvironmentVariableResolver("PRISTINE_TELEMETRY_CONSOLE_TRACER_OUTPUT_MODE"), ConsoleTracerOutputModeEnum),
      ]
    },
    /**
     * Skip rendering traces shorter than this many milliseconds. Useful when most requests
     * are fast and you only want to see the slow outliers. `0` means render everything.
     */
    {
      parameterName: TelemetryModuleKeyname + ".console-tracer.minimum-duration-ms",
      defaultValue: 0,
      isRequired: false,
      defaultResolvers: [
        new NumberResolver(new EnvironmentVariableResolver("PRISTINE_TELEMETRY_CONSOLE_TRACER_MINIMUM_DURATION_MS")),
      ]
    },
    /**
     * Whether `FileTracer` should write completed traces to disk. Off by default. When on,
     * one file per trace is written to `directory` using `filename-pattern`.
     */
    {
      parameterName: TelemetryModuleKeyname + ".file-tracer.activated",
      defaultValue: false,
      isRequired: false,
      defaultResolvers: [
        new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_TELEMETRY_FILE_TRACER_ACTIVATED")),
      ]
    },
    /**
     * Output format for `FileTracer`. Reuses the same enum as `ConsoleTracer` — `json`
     * is the practical default for files since it's machine-readable.
     */
    {
      parameterName: TelemetryModuleKeyname + ".file-tracer.output-mode",
      defaultValue: ConsoleTracerOutputModeEnum.Json,
      isRequired: false,
      defaultResolvers: [
        new EnumResolver(new EnvironmentVariableResolver("PRISTINE_TELEMETRY_FILE_TRACER_OUTPUT_MODE"), ConsoleTracerOutputModeEnum),
      ]
    },
    /**
     * Directory where `FileTracer` writes trace files. Resolved relative to `process.cwd()`
     * if not absolute. The directory is created on demand if it doesn't exist.
     */
    {
      parameterName: TelemetryModuleKeyname + ".file-tracer.directory",
      defaultValue: "./traces",
      isRequired: false,
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_TELEMETRY_FILE_TRACER_DIRECTORY"),
      ]
    },
    /**
     * Filename pattern for `FileTracer`. Supports the placeholders:
     *   - `<traceId>` — the trace's UUID (also used as the eventId throughout Pristine)
     *   - `<date>`    — UTC date as `YYYY-MM-DD`
     *   - `<timestamp>` — milliseconds since epoch at the moment the trace ended
     * Default: `<traceId>.json` (or `.txt` if you change the output mode away from json).
     */
    {
      parameterName: TelemetryModuleKeyname + ".file-tracer.filename-pattern",
      defaultValue: "<traceId>.json",
      isRequired: false,
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_TELEMETRY_FILE_TRACER_FILENAME_PATTERN"),
      ]
    }
  ]
}
