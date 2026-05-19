import fs from "fs";
import path from "path";
import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {CommandInterface} from "../interfaces/command.interface";
import {CliOutput} from "../managers/cli-output.manager";
import {CliModuleKeyname} from "../cli.module.keyname";
import {InitCommandOptions} from "./init.command-options";
import {InitAnswers, InitPrompt} from "../bootstrap/init-prompt";

/**
 * Scaffolds a new Pristine project setup. In a TTY, prompts the user for source path,
 * output path, tsconfig, build format, and a couple of yes/no decisions; in non-TTY (CI),
 * accepts every value via `--source-path`, `--output-path`, etc. flags or refuses to run.
 *
 * What it produces:
 *   - `pristine.config.ts` at the project root with the answers populated.
 *   - Optionally, a starter AppModule at the configured `sourcePath` (only when the file
 *     doesn't already exist — never overwrites).
 *   - Optionally, `npm` scripts in `package.json`: `build`, `start`, `verify` (only ones
 *     that don't already exist — never overwrites).
 *   - `.pristine/` added to `.gitignore` if a `.gitignore` exists at the project root.
 *
 * Refuses to overwrite an existing `pristine.config.ts` so re-running init is safe.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class InitCommand implements CommandInterface<InitCommandOptions> {
  optionsType = InitCommandOptions;
  name = "p:init";
  description = "Scaffold pristine.config.ts (and optionally an AppModule + npm scripts) interactively.";

  private readonly configFileName: string = "pristine.config.ts";
  private readonly gitignoreEntry: string = ".pristine/";

  constructor(
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    private readonly cliOutput: CliOutput,
    private readonly initPrompt: InitPrompt,
  ) {
  }

  async run(args: InitCommandOptions): Promise<ExitCode | number> {
    const projectRoot = process.cwd();
    const configPath = path.resolve(projectRoot, this.configFileName);

    if (fs.existsSync(configPath)) {
      this.logHandler.error(`${this.configFileName} already exists at ${configPath}. Aborting to avoid overwriting.`);
      return ExitCode.Error;
    }

    const answers = await this.gatherAnswers(args);
    if (answers === undefined) {
      // Already-rendered error for non-TTY missing flags. Bail.
      return ExitCode.Error;
    }

    fs.writeFileSync(configPath, this.renderConfigTemplate(answers), "utf8");
    this.logHandler.success(`Created ${path.relative(projectRoot, configPath)}`);

    if (answers.scaffoldSource) {
      this.scaffoldSource(projectRoot, answers.sourcePath);
    }

    if (answers.writePackageScripts) {
      this.addPackageScripts(projectRoot);
    }

    this.addToGitignore(projectRoot);

    this.logHandler.info("Next steps:");
    this.cliOutput.writeLine("  1. npm install --save-dev @pristine-ts/cli  (if you haven't already)");
    this.cliOutput.writeLine("  2. npm run build       # compile your AppModule");
    this.cliOutput.writeLine("  3. npm run start       # boot your app");

    return ExitCode.Success;
  }

  /**
   * Fills in answers from CLI flags first, then prompts (in TTY) for whatever's missing.
   * Returns undefined when running non-TTY with insufficient flags so the caller can exit
   * with the right error code (already rendered).
   * @private
   */
  private async gatherAnswers(args: InitCommandOptions): Promise<InitAnswers | undefined> {
    const sourcePath = args["source-path"];
    const outputPath = args["output-path"];
    const tsconfig = args.tsconfig;
    const format = args.format;

    if (this.initPrompt.isInteractive() === false) {
      const missing: string[] = [];
      if (sourcePath === undefined) missing.push("--source-path");
      if (outputPath === undefined) missing.push("--output-path");
      if (missing.length > 0) {
        this.logHandler.error("Non-interactive run is missing required flag(s). Either run `pristine init` in a terminal or pass the flags explicitly.", {highlights: {missing}});
        return undefined;
      }
    }

    return {
      sourcePath: await this.initPrompt.askSourcePath(sourcePath),
      outputPath: await this.initPrompt.askOutputPath(outputPath),
      tsconfig: await this.initPrompt.askTsconfig(tsconfig),
      format: await this.initPrompt.askFormat(format),
      scaffoldSource: await this.initPrompt.askScaffoldSource(args.scaffold, sourcePath ?? "src/app.module.ts"),
      writePackageScripts: await this.initPrompt.askWritePackageScripts(args.scripts),
    };
  }

  /**
   * Writes a starter AppModule at the configured source path if and only if the file
   * doesn't already exist. Never overwrites — re-running init on an established project
   * shouldn't risk clobbering real code.
   * @private
   */
  private scaffoldSource(projectRoot: string, sourcePath: string): void {
    const absolutePath = path.resolve(projectRoot, sourcePath);
    if (fs.existsSync(absolutePath)) {
      this.logHandler.info("AppModule source already exists; skipping scaffold.", {highlights: {sourcePath}});
      return;
    }
    fs.mkdirSync(path.dirname(absolutePath), {recursive: true});
    fs.writeFileSync(absolutePath, this.renderAppModuleTemplate(), "utf8");
    this.logHandler.success(`Created ${sourcePath}`);
  }

  /**
   * Adds `build`, `start`, `verify` to package.json's scripts. Only adds scripts that
   * don't already exist — never overwrites a user-defined script.
   * @private
   */
  private addPackageScripts(projectRoot: string): void {
    const packageJsonPath = path.resolve(projectRoot, "package.json");
    if (fs.existsSync(packageJsonPath) === false) {
      this.logHandler.warning("package.json not found; skipping script additions.");
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    } catch (error) {
      this.logHandler.error("Failed to parse package.json", {highlights: {error: (error as Error).message}});
      return;
    }

    parsed.scripts = parsed.scripts ?? {};
    const desired: Record<string, string> = {
      build: "pristine build",
      start: "pristine start",
      verify: "pristine verify",
    };

    const added: string[] = [];
    const skipped: string[] = [];
    for (const [scriptName, scriptCommand] of Object.entries(desired)) {
      if (parsed.scripts[scriptName] === undefined) {
        parsed.scripts[scriptName] = scriptCommand;
        added.push(scriptName);
      } else {
        skipped.push(scriptName);
      }
    }

    if (added.length === 0) {
      this.logHandler.info("All target scripts already exist in package.json; nothing added.");
      return;
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(parsed, null, 2) + "\n", "utf8");
    this.logHandler.success(`Added ${added.length} script(s) to package.json`, {highlights: {added}});
    if (skipped.length > 0) {
      this.logHandler.info("Kept existing script(s)", {highlights: {skipped}});
    }
  }

  /**
   * Adds `.pristine/` to `.gitignore` if `.gitignore` exists and the entry isn't already
   * there. Doesn't create `.gitignore` from scratch — that would be presumptuous in a
   * project that hasn't initialized git.
   * @private
   */
  private addToGitignore(projectRoot: string): void {
    const gitignorePath = path.resolve(projectRoot, ".gitignore");
    if (fs.existsSync(gitignorePath) === false) return;

    const current = fs.readFileSync(gitignorePath, "utf8");
    const lines = current.split("\n").map(l => l.trim());
    if (lines.includes(this.gitignoreEntry) || lines.includes(".pristine") || lines.includes(".pristine/*")) {
      return;
    }

    const separator = current.endsWith("\n") ? "" : "\n";
    fs.appendFileSync(gitignorePath, `${separator}${this.gitignoreEntry}\n`, "utf8");
    this.logHandler.info(`Added '${this.gitignoreEntry}' to .gitignore`);
  }

  private renderConfigTemplate(answers: InitAnswers): string {
    return `import {defineConfig} from "@pristine-ts/cli";

/**
 * Pristine CLI configuration. Generated by \`pristine init\`. Re-run \`pristine init\` to
 * regenerate (it refuses to overwrite this file by design — delete it first).
 */
export default defineConfig({
  cli: {
    appModule: {
      sourcePath: "${answers.sourcePath}",
      outputPath: "${answers.outputPath}",
    },
    build: {
      tsconfig: "${answers.tsconfig}",
      format: "${answers.format}",
    },
  },
});
`;
  }

  private renderAppModuleTemplate(): string {
    return `import {AppModuleInterface, ExitCode} from "@pristine-ts/common";
import {CoreModule} from "@pristine-ts/core";

/**
 * Your application's root module. Imported by \`pristine\` at boot — anything reachable from
 * \`importModules\` / \`importServices\` is registered with the kernel.
 */
export const AppModule: AppModuleInterface = {
  keyname: "my-app",
  importModules: [
    CoreModule,
  ],
  importServices: [],
};
`;
  }
}
