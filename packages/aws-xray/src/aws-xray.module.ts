import {ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {AwsXrayModuleKeyname} from "./aws-xray.module.keyname";
import {TelemetryModule} from "@pristine-ts/telemetry";

export * from "./tracers/tracers";

export const AwsXrayModule: ModuleInterface = {
    keyname: AwsXrayModuleKeyname,
    configurationDefinitions: [
    ],

    importServices: [],

    importModules:[TelemetryModule],
    /**
     * This property allows you to custom register specific services. For example, you can assign a tag or use a factory
     * to instantiate a specific class.
     */
    providerRegistrations: [
    ],
}
