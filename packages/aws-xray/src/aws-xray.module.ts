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
     * Whether the X-Ray tracer should actually export traces. When `false`, the tracer
     * is still constructed (it has to be — its constructor wires up the stream listener
     * the framework pushes traces into), but the listener early-returns instead of
     * touching the AWS X-Ray SDK. Lets consumers keep `@pristine-ts/aws-xray` in their
     * AppModule's import graph (or have it pulled in transitively) without exporting
     * traces in environments where X-Ray isn't reachable (local dev, tests, etc.).
     *
     * Default `true` for back-compat; will flip to `false` in a future major.
     */
    {
      parameterName: AwsXrayModuleKeyname + ".activated",
      defaultValue: true,
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
