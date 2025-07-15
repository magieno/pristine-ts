import {LogHighlights} from "./log-highlights.type";
import {OutputHints} from "./output-hints.type";

export type LogData =
  {highlights?: LogHighlights, extra?:any, eventId?: string, eventGroupId?: string, outputHints?: OutputHints} |
  {highlights?: LogHighlights, extra?:any, outputHints?: OutputHints, eventId: string, breadcrumb: string, eventGroupId?: string} |
  any