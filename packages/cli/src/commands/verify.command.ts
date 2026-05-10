import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {inject, injectable} from "tsyringe";
import {Kernel} from "@pristine-ts/core";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {CommandInterface} from "../interfaces/command.interface";
import {ExitCodeEnum} from "../enums/exit-code.enum";
import {CliModuleKeyname} from "../cli.module.keyname";
import {loadAppModule} from "../bootstrap/app-module-loader";

/**
 * Verifies that the consumer's AppModule can be instantiated against its configuration. Builds a fresh
 * throw-away kernel, runs every boot phase capturing per-phase outcomes, executes every embedder-registered
 * `InstantiationTestInterface`, and routes the resulting report through the project's LogHandler.
 *
 * Note: this command runs after the CLI's own `kernel.start()` has succeeded, so it cannot be used to debug
 * a configuration that is so broken the CLI can't start. For that case, call `kernel.verifyInstantiation(...)`
 * directly from a small JS script that imports your AppModule.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class VerifyCommand implements CommandInterface<null> {
  optionsType = null;
  name = "p:verify";

  constructor(
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
  ) {
  }

  async run(args: any): Promise<ExitCodeEnum | number> {
    const skipTests = args?.["skip-tests"] === true || args?.skipTests === true;

    const {appModule, configuration} = await loadAppModule();

    const kernel = new Kernel();
    const report = await kernel.verifyInstantiation(appModule, configuration, {
      runInstantiationTests: !skipTests,
    });

    report.log(this.logHandler);

    return report.hasErrors ? ExitCodeEnum.Error : ExitCodeEnum.Success;
  }
}
