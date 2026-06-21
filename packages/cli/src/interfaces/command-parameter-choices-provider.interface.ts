import {CommandParameterChoicesContext} from "./command-parameter-choices-context.interface";
import {CommandParameterChoicesList} from "../types/command-parameter-choices-list.type";

/**
 * A dependency-injected provider of dynamic `@commandParameter` choices. Reference the
 * provider *class* from `@commandParameter({choices: MyProvider})`; the CLI resolves it from
 * the container at prompt time (so it can inject a `FileManager`, `HttpClient`, …) and calls
 * `getChoices`. Use this form when choice resolution needs framework services; use a plain
 * resolver function when it doesn't.
 *
 * The provider class must be registered with DI (`@injectable()`, and `@moduleScoped` to the
 * consuming module as usual).
 */
export interface CommandParameterChoicesProviderInterface {
  /**
   * Returns the allowed choices, optionally narrowed by the already-resolved arguments in
   * `context`. May be async (the resolver awaits it). Returning an empty list disables the
   * menu — the value then falls through to the normal free-text prompt + validation.
   */
  getChoices(context: CommandParameterChoicesContext): CommandParameterChoicesList | Promise<CommandParameterChoicesList>;
}
