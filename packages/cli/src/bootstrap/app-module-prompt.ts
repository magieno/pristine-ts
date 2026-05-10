import {injectable} from "tsyringe";
import {AppModuleDiscoveryCandidate} from "./app-module-discovery-candidate";
import {AppModuleDiscoveryReasonEnum} from "./app-module-discovery-reason.enum";
import {DynamicImporter} from "./dynamic-importer";

/**
 * TTY disambiguation for the AppModule discovery cascade. When multiple equally-ranked
 * candidates exist and stdin/stdout are both connected to a real terminal, ask the user
 * to pick one. When non-interactive (CI, Docker, redirected stdin), the caller should
 * fall back to throwing an actionable error rather than guessing.
 *
 * `@inquirer/prompts` is dynamic-imported through `DynamicImporter` so the prompt UI
 * dependency only loads when actually prompting — keeps non-interactive startup fast and
 * avoids paying for inquirer's TTY-detection overhead on every invocation.
 */
@injectable()
export class AppModulePrompt {
  private readonly cancelLabel: string = "Cancel";

  constructor(private readonly dynamicImporter: DynamicImporter) {
  }

  isInteractive(): boolean {
    return Boolean((process.stdout as any).isTTY) && Boolean((process.stdin as any).isTTY);
  }

  async prompt(candidates: AppModuleDiscoveryCandidate[]): Promise<string | undefined> {
    const inquirer = await this.dynamicImporter.import("@inquirer/prompts");
    const select: (config: any) => Promise<string | null> = inquirer.select;

    try {
      const choice = await select({
        message: "Multiple AppModule candidates were found. Which one should pristine load?",
        choices: [
          ...candidates.map(c => ({
            name: `${c.displayPath}  ${this.reasonLabel(c.reason)}`,
            value: c.absolutePath,
          })),
          {name: this.cancelLabel, value: null},
        ],
      });
      return choice ?? undefined;
    } catch {
      // @inquirer throws on Ctrl+C / SIGINT — treat as a clean abort, not a crash.
      return undefined;
    }
  }

  private reasonLabel(reason: AppModuleDiscoveryReasonEnum): string {
    switch (reason) {
      case AppModuleDiscoveryReasonEnum.Named: return "(matches app.module.*)";
      case AppModuleDiscoveryReasonEnum.Exports: return "(exports AppModule)";
    }
  }
}
