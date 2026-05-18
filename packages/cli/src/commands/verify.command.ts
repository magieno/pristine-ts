import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {inject, injectable} from "tsyringe";
import {Kernel} from "@pristine-ts/core";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {CommandInterface} from "../interfaces/command.interface";
import {CliModuleKeyname} from "../cli.module.keyname";
import {AppModuleLoader} from "../bootstrap/app-module-loader";

/**
 * Verifies that the consumer's AppModule can be instantiated against its configuration.
 * Builds a fresh throw-away kernel, runs every boot phase capturing per-phase outcomes,
 * executes every embedder-registered `InstantiationTestInterface`, and routes the resulting
 * report through the project's `LogHandlerInterface`.
 *
 * Note: this command runs after the CLI's own `kernel.start()` has succeeded, so it cannot
 * be used to debug a configuration that is so broken the CLI can't start. For that case,
 * call `kernel.verifyInstantiation(...)` directly from a small script that imports your
 * AppModule.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class VerifyCommand implements CommandInterface<null> {
  optionsType = null;
  name = "p:verify";
  description = "Verify the AppModule boots cleanly and run all registered InstantiationTests.";

  constructor(
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    private readonly appModuleLoader: AppModuleLoader,
  ) {
  }

  async run(args: any): Promise<ExitCode | number> {
    const skipTests = args?.["skip-tests"] === true || args?.skipTests === true;

    const {appModule, configuration} = await this.appModuleLoader.load();

    const kernel = new Kernel();
    const report = await kernel.verifyInstantiation(appModule, configuration, {
      runInstantiationTests: !skipTests,
    });

    report.log(this.logHandler);

    return report.hasErrors ? ExitCode.Error : ExitCode.Success;
  }
}
