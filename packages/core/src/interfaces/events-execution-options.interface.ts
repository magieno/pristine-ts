import {Event} from "../models/event";

export interface EventsExecutionOptionsInterface<T> {
  events: Event<T>[];

  executionOrder: "sequential" | "parallel";
}
