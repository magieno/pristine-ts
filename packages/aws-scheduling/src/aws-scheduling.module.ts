import {ModuleInterface} from "@pristine-ts/common";
import {AwsSchedulingModuleKeyname} from "./aws-scheduling.module.keyname";
import {LoggingModule} from "@pristine-ts/logging";
import {SchedulingModule} from "@pristine-ts/scheduling";
import {AwsModule} from "@pristine-ts/aws";

export * from "./event-handlers/event-handlers";

export const AwsSchedulingModule: ModuleInterface = {
  keyname: AwsSchedulingModuleKeyname,
  configurationDefinitions: [],

  importModules: [
    AwsModule,
    SchedulingModule,
    LoggingModule,
  ],
  /**
   * This property allows you to custom register specific services. For example, you can assign a tag or use a factory
   * to instantiate a specific class.
   */
  providerRegistrations: [],
}
