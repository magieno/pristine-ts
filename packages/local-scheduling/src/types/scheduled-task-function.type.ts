/**
 * The function a dynamically-registered schedule runs on each fire.
 *
 * It receives the `eventId` the scheduler generates for the occurrence (correlating logs to
 * a specific fire), mirroring {@link ScheduledTaskInterface.run}. The argument is optional to
 * consume: a plain `() => Promise<void>` (or a synchronous `() => void`) is assignable to
 * this type, so the common case stays terse. A returned promise is awaited, which is what
 * lets the overlap policy detect a still-running invocation.
 */
export type ScheduledTaskFunction = (eventId?: string) => void | Promise<void>;
