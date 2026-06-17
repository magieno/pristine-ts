import {injectable} from "tsyringe";
import {CliPrompt} from "../managers/cli-prompt.manager";

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
 * Interactive Q&A for `pristine init`. Prompts through {@link CliPrompt}, the CLI's native
 * (no third-party dependency) terminal-prompt manager.
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

  constructor(private readonly cliPrompt: CliPrompt) {
  }

  isInteractive(): boolean {
    return Boolean((process.stdout as any).isTTY) && Boolean((process.stdin as any).isTTY);
  }

  async askSourcePath(current: string | undefined): Promise<string> {
    if (current !== undefined) return current;
    return this.cliPrompt.input("Where does your AppModule source file live?", this.defaultSourcePath);
  }

  async askOutputPath(current: string | undefined): Promise<string> {
    if (current !== undefined) return current;
    return this.cliPrompt.input("Where should the compiled AppModule output land?", this.defaultOutputPath);
  }

  async askTsconfig(current: string | undefined): Promise<string> {
    if (current !== undefined) return current;
    return this.cliPrompt.input("Which tsconfig should `pristine build` use?", this.defaultTsconfig);
  }

  async askFormat(current: "esm" | "cjs" | "both" | undefined): Promise<"esm" | "cjs" | "both"> {
    if (current !== undefined) return current;
    return this.cliPrompt.select<"esm" | "cjs" | "both">(
      "Which build format do you want?",
      [
        {name: "esm  (modern, recommended)", value: "esm"},
        {name: "cjs  (CommonJS)", value: "cjs"},
        {name: "both (publish ESM + CJS)", value: "both"},
      ],
      this.defaultFormat,
    );
  }

  async askScaffoldSource(current: boolean | undefined, sourcePath: string): Promise<boolean> {
    if (current !== undefined) return current;
    return this.cliPrompt.confirm(`Scaffold a starter AppModule at ${sourcePath}?`, true);
  }

  async askWritePackageScripts(current: boolean | undefined): Promise<boolean> {
    if (current !== undefined) return current;
    return this.cliPrompt.confirm(
      "Add `build`, `start`, `verify` scripts to package.json (only ones that don't already exist)?",
      true,
    );
  }
}
