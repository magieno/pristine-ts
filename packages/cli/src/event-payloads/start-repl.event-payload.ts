/**
 * Payload that signals "launch the interactive REPL." Produced by `ReplStartEventMapper`
 * for argv shapes with no command (`pristine`) or with the explicit `repl` command
 * (`pristine repl`). Consumed by `ReplStartEventHandler` which runs the readline loop
 * for the rest of the process lifetime.
 *
 * The payload carries the `scriptPath` (argv[1]) for parity with `CommandEventPayload`
 * and for diagnostics; the REPL itself reads its input from stdin, not from the payload.
 */
export class StartReplEventPayload {
  constructor(public scriptPath: string) {
  }
}
