import {LogHighlights} from "./log-highlights.type";
import {OutputHints} from "./output-hints.type";

export type LogData =
  { highlights?: LogHighlights, extra?: any, eventId?: string, eventGroupId?: string, outputHints?: OutputHints } |
  any
