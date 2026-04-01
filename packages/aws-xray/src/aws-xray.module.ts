import {ModuleInterface} from "@pristine-ts/common";
import {AwsXrayModuleKeyname} from "./aws-xray.module.keyname";
import {TelemetryModule} from "@pristine-ts/telemetry";
import {LoggingModule} from "@pristine-ts/logging";
import {BooleanResolver, EnvironmentVariableResolver} from "@pristine-ts/configuration";

export * from "./tracers/tracers";

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
