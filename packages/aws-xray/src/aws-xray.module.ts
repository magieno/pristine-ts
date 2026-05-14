import {ModuleInterface} from "@pristine-ts/common";
import {AwsXrayModuleKeyname} from "./aws-xray.module.keyname";
import {TelemetryModule} from "@pristine-ts/telemetry";
import {LoggingModule} from "@pristine-ts/logging";
import {BooleanResolver, EnvironmentVariableResolver} from "@pristine-ts/configuration";

export * from "./tracers/tracers";

export * from "./aws-xray.configuration-keys";
export const AwsXrayModule: ModuleInterface = {
  keyname: AwsXrayModuleKeyname,
  configurationDefinitions: [
    {
      parameterName: AwsXrayModuleKeyname + ".debug",
      defaultValue: false,
      isRequired: false,
      defaultResolvers: [
        new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_AWS_XRAY_DEBUG")),
      ]
    },
    /**
     * Whether the X-Ray tracer should actually export traces. **Default `false`** —
     * importing `@pristine-ts/aws-xray` (directly or transitively) is no longer enough
     * on its own to start exporting; you must explicitly opt in by setting this to
     * `true` (or `PRISTINE_AWS_XRAY_ACTIVATED=true`).
     *
     * The tracer is always constructed when the package is in the import graph (it has
     * to be — the constructor wires up the stream listener the framework pushes traces
     * into). When `activated === false`, the listener early-returns instead of touching
     * the AWS X-Ray SDK. No segments are sent, no AWS credentials are required.
     *
     * This default-off model means local dev, tests, and CI environments don't
     * accidentally try to ship segments to X-Ray when AWS isn't reachable.
     */
    {
      parameterName: AwsXrayModuleKeyname + ".activated",
      defaultValue: false,
      isRequired: false,
      defaultResolvers: [
        new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_AWS_XRAY_ACTIVATED")),
      ]
    }
  ],

  importModules: [
    TelemetryModule,
    LoggingModule,
  ],
  /**
   * This property allows you to custom register specific services. For example, you can assign a tag or use a factory
   * to instantiate a specific class.
   */
  providerRegistrations: [],
}
