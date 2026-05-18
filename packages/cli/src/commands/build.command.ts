import fs from "fs";
import path from "path";
import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CommandInterface} from "../interfaces/command.interface";
import {ConsoleManager} from "../managers/console.manager";
import {ShellManager} from "../managers/shell.manager";
import {CliModuleKeyname} from "../cli.module.keyname";
import {ConfigLoader} from "../config/config-loader";
import {BuildManifestWriter} from "../bootstrap/build-manifest-writer";

/**
 * Compiles the consumer's TypeScript project. Reads `build.{outDir,tsconfig,format,clean}`
 * and `appModule.{sourcePath,outputPath}` from `pristine.config.ts`. After a successful
 * compile, writes a build manifest at `<projectRoot>/.pristine/build-manifest.json` so
 * downstream commands (`pristine start`, `pristine verify`) can detect when the build is
 * stale (source edited, output deleted, paths reconfigured).
 *
 * The manifest is only written when both `appModule.sourcePath` and `appModule.outputPath`
 * are configured. Without both, there's nothing to fingerprint and downstream commands fall
 * through to the next layer of the loader cascade.
 *
 * Defaults (when not configured):
 *   - tsconfig: "tsconfig.json"
 *   - format:   "esm"           (single tsc invocation)
 *   - format:   "cjs"           (looks for tsconfig.cjs.json automatically)
 *   - format:   "both"          (runs both invocations sequentially)
 *   - outDir:   not set; tsc writes to whatever the tsconfig declares
 *   - clean:    false           (set true to wipe outDir before building)
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class BuildCommand implements CommandInterface<null> {
  optionsType = null;
  name = "p:build";
  description = "Compile the project's TypeScript using tsc.";

  private readonly defaultTsconfig: string = "tsconfig.json";
  private readonly defaultFormat: "esm" | "cjs" | "both" = "esm";

  constructor(
    private readonly consoleManager: ConsoleManager,
    private readonly shellManager: ShellManager,
    private readonly configLoader: ConfigLoader,
    private readonly buildManifestWriter: BuildManifestWriter,
  ) {
  }

  async run(args: any): Promise<ExitCode | number> {
    const projectRoot = process.cwd();
    const resolvedConfig = await this.configLoader.load({startDir: projectRoot});
    const buildConfig = resolvedConfig.config.build ?? {};

    const tsconfig = buildConfig.tsconfig ?? this.defaultTsconfig;
    const format = buildConfig.format ?? this.defaultFormat;
    const clean = buildConfig.clean ?? false;
    const outDir = buildConfig.outDir;

    if (clean && outDir !== undefined) {
      const absOut = path.resolve(projectRoot, outDir);
      if (fs.existsSync(absOut)) {
        this.consoleManager.writeInfo(`Cleaning ${outDir}/`);
        fs.rmSync(absOut, {recursive: true, force: true});
      }
    }

    const invocations = this.resolveTscInvocations(projectRoot, tsconfig, format);
    if (invocations.length === 0) {
      this.consoleManager.writeError(
        `No tsconfig found. Looked for: ${this.expectedTsconfigsForFormat(tsconfig, format).join(", ")}`,
      );
      return ExitCode.Error;
    }

    for (const tsconfigPath of invocations) {
      const relTsconfig = path.relative(projectRoot, tsconfigPath);
      this.consoleManager.writeInfo(`Compiling with ${relTsconfig}`);
      try {
        // The shell command runs in the current process's CWD, which is already projectRoot.
        // Don't pass `directory` here — ShellManager's PathManager resolution would double
        // the absolute path back onto itself producing /private/tmp/.../private/tmp/...
        await this.shellManager.execute(`npx tsc -p ${relTsconfig}`, {
          streamStdout: true,
          outputDuration: false,
          outputTimeBeforeExecutingCommand: false,
        });
      } catch (error) {
        this.consoleManager.writeError(`tsc failed for ${relTsconfig}`);
        return ExitCode.Error;
      }
    }

    this.writeManifestIfConfigured(projectRoot, resolvedConfig.config.appModule);

    this.consoleManager.writeSuccess(`Build complete (${invocations.length} tsconfig${invocations.length > 1 ? "s" : ""}).`);
    return ExitCode.Success;
  }

  private writeManifestIfConfigured(projectRoot: string, appModule: { sourcePath?: string; outputPath?: string } | undefined): void {
    if (appModule?.sourcePath === undefined || appModule?.outputPath === undefined) {
      // No `appModule` block in the config — nothing to fingerprint. The manifest layer
      // is a no-op until the user runs `pristine init`.
      return;
    }

    const absoluteSource = path.resolve(projectRoot, appModule.sourcePath);
    const absoluteOutput = path.resolve(projectRoot, appModule.outputPath);

    if (fs.existsSync(absoluteSource) === false) {
      this.consoleManager.writeWarning(
        `Build succeeded but appModule.sourcePath '${appModule.sourcePath}' does not exist; skipping manifest.`,
      );
      return;
    }
    if (fs.existsSync(absoluteOutput) === false) {
      this.consoleManager.writeWarning(
        `Build succeeded but appModule.outputPath '${appModule.outputPath}' was not produced; skipping manifest. ` +
        `Check your tsconfig outDir / file layout.`,
      );
      return;
    }

    const manifest = this.buildManifestWriter.write(projectRoot, appModule.sourcePath, appModule.outputPath);
    this.consoleManager.writeInfo(`Manifest written: .pristine/build-manifest.json (built at ${manifest.builtAt})`);
  }

  /**
   * For `format: "both"`, we run two passes: the primary tsconfig (assumed ESM-ish), then
   * the `.cjs.json` sibling. For `cjs`/`esm`, we run only the matching one. Returns the
   * absolute tsconfig paths in the order they should run.
   * @private
   */
  private resolveTscInvocations(projectRoot: string, primary: string, format: "esm" | "cjs" | "both"): string[] {
    const primaryAbs = path.resolve(projectRoot, primary);

    if (format === "esm") {
      return fs.existsSync(primaryAbs) ? [primaryAbs] : [];
    }

    const cjsAbs = primaryAbs.replace(/\.json$/, ".cjs.json");

    if (format === "cjs") {
      return fs.existsSync(cjsAbs) ? [cjsAbs] : (fs.existsSync(primaryAbs) ? [primaryAbs] : []);
    }

    // both
    const result: string[] = [];
    if (fs.existsSync(primaryAbs)) result.push(primaryAbs);
    if (fs.existsSync(cjsAbs)) result.push(cjsAbs);
    return result;
  }

  private expectedTsconfigsForFormat(primary: string, format: "esm" | "cjs" | "both"): string[] {
    if (format === "esm") return [primary];
    const cjs = primary.replace(/\.json$/, ".cjs.json");
    if (format === "cjs") return [cjs, primary];
    return [primary, cjs];
  }
}
