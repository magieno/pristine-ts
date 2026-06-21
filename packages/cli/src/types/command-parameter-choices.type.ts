import {ClassConstructor} from "class-transformer";
import {CommandParameterChoicesList} from "./command-parameter-choices-list.type";
import {CommandParameterChoicesResolver} from "./command-parameter-choices-resolver.type";
import {CommandParameterChoicesProviderInterface} from "../interfaces/command-parameter-choices-provider.interface";

/**
 * What `@commandParameter({choices})` accepts. Three shapes, one behavior (single-select):
 *
 *   - **static** — a `CommandParameterChoicesList` (array of `{name, value}` or bare strings)
 *     known at decoration time;
 *   - **dynamic, no DI** — a `CommandParameterChoicesResolver` function resolved at prompt
 *     time;
 *   - **dynamic, with DI** — the *class* of a `CommandParameterChoicesProviderInterface`,
 *     resolved from the container at prompt time so it can inject framework services.
 *
 * Dynamic choices are resolved only on the interactive path (an arrow-key menu); a value
 * passed as a flag is taken as-is. Add `@IsIn(...)` if a dynamic value must also be validated
 * when supplied non-interactively.
 */
export type CommandParameterChoices =
  | CommandParameterChoicesList
  | CommandParameterChoicesResolver
  | ClassConstructor<CommandParameterChoicesProviderInterface>;
