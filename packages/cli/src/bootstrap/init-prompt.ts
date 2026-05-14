import {injectable} from "tsyringe";
import {DynamicImporter} from "./dynamic-importer";

/**
 * Answers the init flow needs to gather. Each field corresponds to one config value that
 * `pristine.config.ts` will end up with. The init command resolves these from CLI flags
 * first, then prompts (in TTY) for whatever's missing.
 */
export interface InitAnswers {
  sourcePath: string;
  outputPath: string;
  tsconfig: string;
  format: "esm" | "cjs" | "both";
  scaffoldSource: boolean;
  writePackageScripts: boolean;
}

/**
 * Interactive Q&A for `pristine init`. Lazy-loads `@inquirer/prompts` so the dep cost is
 * only paid when actually prompting (the same pattern as `BuildStalenessPrompt` uses).
 *
 * Each method takes a "current value" so callers can pre-fill answers from CLI flags and
 * only prompt for the gaps. Returning the same value the user passed in is intentional —
 * it keeps the call sites uniform regardless of whether the value came from a flag or a
 * prompt.
 */
@injectable()
export class InitPrompt {
  private readonly defaultSourcePath: string = "src/app.module.ts";
  private readonly defaultOutputPath: string = "dist/app.module.js";
  private readonly defaultTsconfig: string = "tsconfig.json";
  private readonly defaultFormat: "esm" | "cjs" | "both" = "esm";

  constructor(private readonly dynamicImporter: DynamicImporter) {
  }

  isInteractive(): boolean {
    return Boolean((process.stdout as any).isTTY) && Boolean((process.stdin as any).isTTY);
  }

  async askSourcePath(current: string | undefined): Promise<string> {
    if (current !== undefined) return current;
    const inquirer = await this.dynamicImporter.import("@inquirer/prompts");
    const input: (config: any) => Promise<string> = inquirer.input;
    return input({
      message: "Where does your AppModule source file live?",
      default: this.defaultSourcePath,
    });
  }

  async askOutputPath(current: string | undefined): Promise<string> {
    if (current !== undefined) return current;
    const inquirer = await this.dynamicImporter.import("@inquirer/prompts");
    const input: (config: any) => Promise<string> = inquirer.input;
    return input({
      message: "Where should the compiled AppModule output land?",
      default: this.defaultOutputPath,
    });
  }

  async askTsconfig(current: string | undefined): Promise<string> {
    if (current !== undefined) return current;
    const inquirer = await this.dynamicImporter.import("@inquirer/prompts");
    const input: (config: any) => Promise<string> = inquirer.input;
    return input({
      message: "Which tsconfig should `pristine build` use?",
      default: this.defaultTsconfig,
    });
  }

  async askFormat(current: "esm" | "cjs" | "both" | undefined): Promise<"esm" | "cjs" | "both"> {
    if (current !== undefined) return current;
    const inquirer = await this.dynamicImporter.import("@inquirer/prompts");
    const select: (config: any) => Promise<"esm" | "cjs" | "both"> = inquirer.select;
    return select({
      message: "Which build format do you want?",
      choices: [
        {name: "esm  (modern, recommended)", value: "esm"},
        {name: "cjs  (CommonJS)", value: "cjs"},
        {name: "both (publish ESM + CJS)", value: "both"},
      ],
      default: this.defaultFormat,
    });
  }

  async askScaffoldSource(current: boolean | undefined, sourcePath: string): Promise<boolean> {
    if (current !== undefined) return current;
    const inquirer = await this.dynamicImporter.import("@inquirer/prompts");
    const confirm: (config: any) => Promise<boolean> = inquirer.confirm;
    return confirm({
      message: `Scaffold a starter AppModule at ${sourcePath}?`,
      default: true,
    });
  }

  async askWritePackageScripts(current: boolean | undefined): Promise<boolean> {
    if (current !== undefined) return current;
    const inquirer = await this.dynamicImporter.import("@inquirer/prompts");
    const confirm: (config: any) => Promise<boolean> = inquirer.confirm;
    return confirm({
      message: "Add `build`, `start`, `verify` scripts to package.json (only ones that don't already exist)?",
      default: true,
    });
  }
}
