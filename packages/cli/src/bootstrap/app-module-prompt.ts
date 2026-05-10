import {AppModuleCandidate} from "./app-module-discovery";

/**
 * Real `import()`. tsc + esbuild both lower `await import(x)` to `require(x)` in CJS output,
 * which breaks ESM-only packages like `@inquirer/prompts`. The Function constructor's body
 * is opaque to both, so the `import()` inside survives unrewritten.
 */
const dynamicImport = new Function("specifier", "return import(specifier);") as (specifier: string) => Promise<any>;

/**
 * Returns true when the current process is attached to an interactive terminal on both
 * stdin and stdout. We check both because @inquirer/prompts needs to read keystrokes
 * (stdin) AND draw to the terminal (stdout) — either being a pipe makes prompting impossible.
 */
export const isInteractive = (): boolean => {
  return Boolean((process.stdout as any).isTTY) && Boolean((process.stdin as any).isTTY);
}

/**
 * Asks the user to pick one of the discovered candidates. Lazy-imports `@inquirer/prompts`
 * so the CLI's startup cost only pays for the prompt UI when the prompt actually runs.
 *
 * Returns the absolute path of the selected candidate, or `undefined` if the user aborted
 * (Ctrl+C / picked the cancel option).
 */
export const promptForCandidate = async (candidates: AppModuleCandidate[]): Promise<string | undefined> => {
  // Dynamic import — keeps the dependency out of the hot path for non-interactive runs and
  // out of every command's startup cost.
  const inquirer = await dynamicImport("@inquirer/prompts");
  const select: (config: any) => Promise<string | null> = inquirer.select;

  try {
    const choice = await select({
      message: "Multiple AppModule candidates were found. Which one should pristine load?",
      choices: [
        ...candidates.map(c => ({
          name: `${c.displayPath}  ${c.reason === "named" ? "(matches app.module.*)" : "(exports AppModule)"}`,
          value: c.absolutePath,
        })),
        {name: "Cancel", value: null},
      ],
    });

    return choice ?? undefined;
  } catch (error) {
    // @inquirer throws on Ctrl+C / SIGINT — treat as a clean abort.
    return undefined;
  }
}
