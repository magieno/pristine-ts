import fs from "fs";
import path from "path";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CommandInterface} from "../interfaces/command.interface";
import {ConsoleManager} from "../managers/console.manager";
import {ExitCodeEnum} from "../enums/exit-code.enum";
import {CliModuleKeyname} from "../cli.module.keyname";

/**
 * Generates a starter `pristine.config.ts` in the current directory. If the consumer's
 * `package.json` already declares `pristine.appModule.path` or `pristine.appModule.cjsPath`,
 * the value is migrated into the new config and the user is told to remove the old field.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class ConfigInitCommand implements CommandInterface<null> {
  optionsType = null;
  name = "p:config:init";
  description = "Generate a starter pristine.config.ts. Migrates from package.json if present.";

  constructor(private readonly consoleManager: ConsoleManager) {
  }

  async run(args: any): Promise<ExitCodeEnum | number> {
    const projectRoot = process.cwd();
    const targetPath = path.resolve(projectRoot, "pristine.config.ts");

    if (fs.existsSync(targetPath)) {
      this.consoleManager.writeError(`pristine.config.ts already exists at ${targetPath}. Aborting to avoid overwriting.`);
      return ExitCodeEnum.Error;
    }

    const migratedAppModulePath = this.detectExistingAppModulePath(projectRoot);

    const body = this.renderConfigTemplate(migratedAppModulePath);
    fs.writeFileSync(targetPath, body, "utf8");

    this.consoleManager.writeSuccess(`Created ${path.relative(projectRoot, targetPath)}`);

    if (migratedAppModulePath !== undefined) {
      this.consoleManager.writeInfo(
        `Migrated 'pristine.appModule' from package.json. ` +
        `You can now remove the 'pristine' field from your package.json.`
      );
    } else {
      this.consoleManager.writeInfo(
        "No existing pristine config found in package.json. " +
        "Edit pristine.config.ts to point at your AppModule."
      );
    }

    return ExitCodeEnum.Success;
  }

  private detectExistingAppModulePath(projectRoot: string): string | undefined {
    const packageJson = path.resolve(projectRoot, "package.json");
    if (fs.existsSync(packageJson) === false) {
      return undefined;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(fs.readFileSync(packageJson, "utf8"));
    } catch {
      return undefined;
    }

    const appModule = parsed?.pristine?.appModule;
    if (appModule?.path !== undefined) {
      return appModule.path;
    }
    if (appModule?.cjsPath !== undefined) {
      return appModule.cjsPath;
    }
    return undefined;
  }

  private renderConfigTemplate(appModulePath: string | undefined): string {
    const pathLine = appModulePath !== undefined
      ? `    path: "${appModulePath}",`
      : `    // path: "dist/app.module.js",   // <-- point this at your AppModule`;

    return `import {defineConfig} from "@pristine-ts/cli";

/**
 * Pristine CLI configuration. See https://github.com/magieno/pristine-ts for the full
 * schema reference.
 */
export default defineConfig({
  appModule: {
${pathLine}
  },

  // build: {
  //   outDir: "dist",
  //   tsconfig: "tsconfig.json",
  //   format: "esm",
  // },

  // start: {
  //   entry: "dist/main.js",
  //   nodeArgs: ["--enable-source-maps"],
  // },

  // plugins: [
  //   // "@my-org/pristine-cli-extras",
  // ],

  // kernelConfiguration: {
  //   // "pristine.logging.logSeverityLevelConfiguration": 1,
  // },
});
`;
  }
}
