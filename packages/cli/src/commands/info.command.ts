import fs from "fs";
import os from "os";
import path from "path";
import {ModuleInterface, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CommandInterface} from "../interfaces/command.interface";
import {ConsoleManager} from "../managers/console.manager";
import {ExitCodeEnum} from "../enums/exit-code.enum";
import {CliModuleKeyname} from "../cli.module.keyname";
import {loadConfig} from "../config/config-loader";
import {loadAppModule} from "../bootstrap/app-module-loader";

/**
 * Diagnostic command. Prints framework version, runtime environment, resolved config + AppModule
 * locations, and the recursively-resolved list of imported modules. Designed for support tickets
 * and "is my project picking up what I think it's picking up?" sanity checks.
 *
 * Does not boot the kernel — it only inspects what *would* be loaded, so it remains useful even
 * when the AppModule is broken in a way that prevents `kernel.start()`.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class InfoCommand implements CommandInterface<null> {
  optionsType = null;
  name = "p:info";
  description = "Print framework version, runtime environment, and the loaded module graph.";

  constructor(private readonly consoleManager: ConsoleManager) {
  }

  async run(args: any): Promise<ExitCodeEnum | number> {
    const cliVersion = this.readCliVersion();
    const resolvedConfig = await loadConfig({startDir: process.cwd()});

    this.consoleManager.writeLine("Pristine CLI");
    this.consoleManager.writeLine(`  Version:        ${cliVersion}`);
    this.consoleManager.writeLine(`  Node:           ${process.version}`);
    this.consoleManager.writeLine(`  Platform:       ${os.platform()} ${os.arch()} (${os.release()})`);
    this.consoleManager.writeLine(`  CWD:            ${process.cwd()}`);
    this.consoleManager.writeLine("");

    this.consoleManager.writeLine("Configuration");
    this.consoleManager.writeLine(`  Config file:    ${resolvedConfig.configFilePath ?? "(none — using defaults)"}`);
    if (resolvedConfig.config.appModule?.path !== undefined) {
      this.consoleManager.writeLine(`  AppModule path: ${resolvedConfig.config.appModule.path}  (from config file)`);
    }
    this.consoleManager.writeLine("");

    // Try to load the AppModule for the imported-modules listing. Failure is fine — info should
    // never crash, so we degrade gracefully and surface the error.
    let modules: ModuleInterface[] = [];
    let pluginCount = 0;
    let pluginNames: string[] = [];
    try {
      const loaded = await loadAppModule();
      modules = this.collectModules(loaded.appModule);
      pluginCount = loaded.plugins.length;
      pluginNames = loaded.plugins.map(p => p.name);
      this.consoleManager.writeLine(`AppModule: ${loaded.appModule.keyname}`);
    } catch (error) {
      this.consoleManager.writeError(`Could not load AppModule: ${(error as Error).message}`);
      return ExitCodeEnum.Error;
    }

    if (pluginCount > 0) {
      this.consoleManager.writeLine(`Plugins (${pluginCount}):`);
      for (const name of pluginNames) {
        this.consoleManager.writeLine(`  - ${name}`);
      }
    }

    this.consoleManager.writeLine(`Imported modules (${modules.length}):`);
    const uniqueByKeyname = new Map<string, ModuleInterface>();
    for (const m of modules) {
      uniqueByKeyname.set(m.keyname, m);
    }
    for (const m of [...uniqueByKeyname.values()].sort((a, b) => a.keyname.localeCompare(b.keyname))) {
      this.consoleManager.writeLine(`  - ${m.keyname}`);
    }

    return ExitCodeEnum.Success;
  }

  private readCliVersion(): string {
    // package.json sits two levels up from dist/lib/cjs/commands/, i.e. ../../../../package.json.
    // We compute the path from __dirname rather than process.cwd() so info reflects the version of
    // the cli that's *running*, not whatever happens to live in the user's project root.
    const candidate = path.resolve(__dirname, "..", "..", "..", "..", "package.json");
    try {
      const pkg = JSON.parse(fs.readFileSync(candidate, "utf8"));
      return pkg.version ?? "unknown";
    } catch {
      return "unknown";
    }
  }

  /**
   * Walks the import tree, returning every module reachable from the root. Visits each module
   * at most once via a keyname-keyed seen-set so circular imports don't loop.
   */
  private collectModules(root: ModuleInterface): ModuleInterface[] {
    const seen = new Set<string>();
    const flat: ModuleInterface[] = [];

    const walk = (m: ModuleInterface): void => {
      if (seen.has(m.keyname)) {
        return;
      }
      seen.add(m.keyname);
      flat.push(m);
      if (m.importModules) {
        for (const child of m.importModules) {
          walk(child);
        }
      }
    }

    walk(root);
    return flat;
  }
}
