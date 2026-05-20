import fs from "fs";
import os from "os";
import path from "path";
import {ModuleInterface, moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {CommandInterface} from "../interfaces/command.interface";
import {CliOutput} from "../managers/cli-output.manager";
import {CliModuleKeyname} from "../cli.module.keyname";
import {ConfigLoader} from "../config/config-loader";
import {AppModuleLoader} from "../bootstrap/app-module-loader";

/**
 * Diagnostic command. Prints framework version, runtime environment, resolved config +
 * AppModule locations, the recursively-resolved list of imported modules, and the list of
 * loaded plugins. Designed for support tickets and "is my project picking up what I think
 * it's picking up?" sanity checks.
 *
 * Does not boot a fresh kernel — it inspects what *would* be loaded by re-running the
 * loader cascade, so it remains useful even when the AppModule is broken in a way that
 * prevents `kernel.start()`.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class InfoCommand implements CommandInterface<null> {
  optionsType = null;
  name = "p:info";
  description = "Print framework version, runtime environment, and the loaded module graph.";

  /**
   * Resolved at command construction time so `pristine info` reports the version of the cli
   * that's actually running, not whatever happens to live in the user's project root. The
   * package.json sits four levels up from dist/lib/cjs/commands/.
   */
  private readonly cliPackageJsonPath: string = path.resolve(__dirname, "..", "..", "..", "..", "package.json");

  constructor(
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    private readonly cliOutput: CliOutput,
    private readonly configLoader: ConfigLoader,
    private readonly appModuleLoader: AppModuleLoader,
  ) {
  }

  async run(args: any): Promise<ExitCode | number> {
    this.printRuntimeBanner();
    await this.printConfigSection();
    return this.printAppModuleSection();
  }

  private printRuntimeBanner(): void {
    this.cliOutput.writeLine("Pristine CLI");
    this.cliOutput.writeLine(`  Version:        ${this.readCliVersion()}`);
    this.cliOutput.writeLine(`  Node:           ${process.version}`);
    this.cliOutput.writeLine(`  Platform:       ${os.platform()} ${os.arch()} (${os.release()})`);
    this.cliOutput.writeLine(`  CWD:            ${process.cwd()}`);
    this.cliOutput.writeLine("");
  }

  private async printConfigSection(): Promise<void> {
    const resolvedConfig = await this.configLoader.load({startDir: process.cwd()});
    this.cliOutput.writeLine("Configuration");
    this.cliOutput.writeLine(`  Config file:    ${resolvedConfig.configFilePath ?? "(none — using defaults)"}`);
    if (resolvedConfig.config.cli?.appModule?.sourcePath !== undefined) {
      this.cliOutput.writeLine(`  AppModule src:  ${resolvedConfig.config.cli.appModule.sourcePath}  (from config file)`);
    }
    if (resolvedConfig.config.cli?.appModule?.outputPath !== undefined) {
      this.cliOutput.writeLine(`  AppModule out:  ${resolvedConfig.config.cli.appModule.outputPath}  (from config file)`);
    }
    this.cliOutput.writeLine("");
  }

  private async printAppModuleSection(): Promise<ExitCode | number> {
    let modules: ModuleInterface[] = [];
    let pluginNames: string[] = [];

    try {
      const loaded = await this.appModuleLoader.load();
      modules = this.collectModules(loaded.appModule);
      pluginNames = loaded.plugins.map(p => p.name);
      this.cliOutput.writeLine(`AppModule: ${loaded.appModule.keyname}`);
    } catch (error) {
      this.logHandler.error("Could not load AppModule", {highlights: {error: (error as Error).message}});
      return ExitCode.Error;
    }

    if (pluginNames.length > 0) {
      this.cliOutput.writeLine(`Plugins (${pluginNames.length}):`);
      for (const name of pluginNames) {
        this.cliOutput.writeLine(`  - ${name}`);
      }
    }

    this.cliOutput.writeLine(`Imported modules (${modules.length}):`);
    const uniqueByKeyname = new Map<string, ModuleInterface>();
    for (const m of modules) {
      uniqueByKeyname.set(m.keyname, m);
    }
    for (const m of [...uniqueByKeyname.values()].sort((a, b) => a.keyname.localeCompare(b.keyname))) {
      this.cliOutput.writeLine(`  - ${m.keyname}`);
    }

    return ExitCode.Success;
  }

  private readCliVersion(): string {
    try {
      const pkg = JSON.parse(fs.readFileSync(this.cliPackageJsonPath, "utf8"));
      return pkg.version ?? "unknown";
    } catch {
      return "unknown";
    }
  }

  /**
   * Walks the import tree, returning every module reachable from the root. Visits each
   * module at most once via a keyname-keyed seen-set so circular imports don't loop.
   * @private
   */
  private collectModules(root: ModuleInterface): ModuleInterface[] {
    const seen = new Set<string>();
    const flat: ModuleInterface[] = [];

    const walk = (m: ModuleInterface): void => {
      if (seen.has(m.keyname)) return;
      seen.add(m.keyname);
      flat.push(m);
      if (m.importModules) {
        for (const child of m.importModules) walk(child);
      }
    };

    walk(root);
    return flat;
  }
}
