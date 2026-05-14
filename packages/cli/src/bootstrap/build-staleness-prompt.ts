import {injectable} from "tsyringe";
import {BuildManifestStalenessEnum} from "./build-manifest-staleness.enum";
import {DynamicImporter} from "./dynamic-importer";

/**
 * When the build manifest is stale (source edited, output missing, etc.), `AppModuleLoader`
 * stops the load and consults this prompt. In a TTY, asks the user whether to run
 * `pristine build` now; in non-TTY (CI, Docker), refuses to prompt and lets the caller exit
 * non-zero with the explanation — auto-rebuilding in CI hides bugs.
 *
 * Just the prompt UI here. The actual rebuild dispatch is the caller's responsibility so
 * this class stays small and testable.
 */
@injectable()
export class BuildStalenessPrompt {
  private readonly promptMessage: string = "Run `pristine build` now to refresh?";

  constructor(private readonly dynamicImporter: DynamicImporter) {
  }

  isInteractive(): boolean {
    return Boolean((process.stdout as any).isTTY) && Boolean((process.stdin as any).isTTY);
  }

  /**
   * Renders a one-line explanation of why the manifest is stale. Used by both the prompt
   * (TTY) and the non-TTY error path so the messaging is identical regardless of channel.
   */
  describe(reason: BuildManifestStalenessEnum): string {
    switch (reason) {
      case BuildManifestStalenessEnum.Missing:
        return "No build manifest found. Run `pristine build` before invoking this command.";
      case BuildManifestStalenessEnum.SourcePathChanged:
        return "Your config's `appModule.sourcePath` no longer matches the last build. Run `pristine build` to rebuild against the new source.";
      case BuildManifestStalenessEnum.OutputPathChanged:
        return "Your config's `appModule.outputPath` no longer matches the last build. Run `pristine build` to rebuild against the new output path.";
      case BuildManifestStalenessEnum.SourceContentChanged:
        return "Your AppModule source has changed since the last build. Run `pristine build` to recompile.";
      case BuildManifestStalenessEnum.OutputMissing:
        return "The compiled AppModule output is missing on disk. Run `pristine build` to produce it.";
      case BuildManifestStalenessEnum.Fresh:
        // Should never be asked to describe Fresh, but a safe fallback beats a thrown error
        // in a hot path.
        return "Build manifest is up to date.";
    }
  }

  /**
   * Asks the user whether to rebuild. Returns `true` for yes, `false` for no, `undefined`
   * for cancellation (Ctrl+C). Caller decides what to do with each outcome.
   */
  async prompt(reason: BuildManifestStalenessEnum): Promise<boolean | undefined> {
    const inquirer = await this.dynamicImporter.import("@inquirer/prompts");
    const confirm: (config: any) => Promise<boolean> = inquirer.confirm;

    try {
      return await confirm({
        message: `${this.describe(reason)}\n  ${this.promptMessage}`,
        default: true,
      });
    } catch {
      // @inquirer throws on Ctrl+C. Treat as a clean cancellation.
      return undefined;
    }
  }
}
