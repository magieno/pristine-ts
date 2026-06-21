import {CommandParameterChoicesContext} from "../interfaces/command-parameter-choices-context.interface";
import {CommandParameterChoicesList} from "./command-parameter-choices-list.type";

/**
 * A plain function that computes a parameter's choices at prompt time, optionally narrowed by
 * the already-resolved arguments. Use this when resolution needs no framework services (env
 * vars, a captured closure, simple computation); reach for
 * `CommandParameterChoicesProviderInterface` when it needs DI.
 */
export type CommandParameterChoicesResolver =
  (context: CommandParameterChoicesContext) => CommandParameterChoicesList | Promise<CommandParameterChoicesList>;
