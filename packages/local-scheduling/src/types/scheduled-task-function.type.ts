import {ScheduledTaskInvocationContext} from "../interfaces/scheduled-task-invocation-context.interface";

/**
 * The function a schedule runs on each fire.
 *
 * The {@link ScheduledTaskInvocationContext} argument is optional to consume: a plain
 * `() => Promise<void>` (or a synchronous `() => void`) is assignable to this type, so the
 * common case stays terse while richer tasks can inspect the fire metadata. A returned
 * promise is awaited, which is what lets the overlap policy detect a still-running
 * invocation.
 */
export type ScheduledTaskFunction = (context: ScheduledTaskInvocationContext) => void | Promise<void>;
