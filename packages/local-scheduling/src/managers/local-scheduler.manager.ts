import {inject, injectable, injectAll, singleton} from "tsyringe";
import {moduleScoped, tag, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {LocalSchedulingModuleKeyname} from "../local-scheduling.module.keyname";
import {CronSchedule} from "../schedules/cron.schedule";
import {LocalSchedulerInterface} from "../interfaces/local-scheduler.interface";
import {SchedulableInterface} from "../interfaces/schedulable.interface";
import {ScheduleInterface} from "../interfaces/schedule.interface";
import {ScheduleOptions} from "../interfaces/schedule-options.interface";
import {ScheduleDescriptor} from "../interfaces/schedule-descriptor.interface";
import {ScheduledTaskFunction} from "../types/scheduled-task-function.type";
import {ScheduleAlreadyExistsError} from "../errors/schedule-already-exists.error";
import {ScheduleNotFoundError} from "../errors/schedule-not-found.error";
import {ScheduleState} from "../interfaces/schedule-state.interface";

/**
 * In-process scheduler driver for long-running Pristine applications (an always-up server, a
 * worker). Unlike {@link SchedulerManager} from `@pristine-ts/scheduling` — which runs tagged
 * tasks when an external trigger (e.g. AWS EventBridge) fires — this manager owns the clock
 * itself and runs each task on its own {@link ScheduleInterface} (cron, one-off date, ...)
 * from inside the Node process.
 *
 * It offers two registration paths that share one id space and one set of timers:
 *
 * - **Dynamic** — schedules registered, replaced, and removed at runtime by id, which suits a
 *   consumer that loads user-defined schedules from a database and mutates them from HTTP
 *   controllers.
 * - **Static** — any class tagged {@link ServiceDefinitionTagEnum.Schedulable} that implements
 *   {@link SchedulableInterface} is discovered via `@injectAll` and **auto-registered on
 *   `start()`** from the schedules it declares.
 *
 * **Timer strategy:** each schedule owns a single chained `setTimeout` armed for its next
 * occurrence, re-armed after every fire. The delay is always recomputed from the current time
 * (never accumulated), so the schedule does not drift; delays beyond the `setTimeout` maximum
 * are chunked. See {@link ScheduleOptions} for the overlap and missed-fire policies.
 *
 * It is tagged `"LocalSchedulerInterface"` and module-scoped to the local-scheduling module,
 * so it can be injected either by class or by interface token. It is a `@singleton()`: there
 * is exactly one instance per process, so the code that starts it at bootstrap and the HTTP
 * controllers that mutate schedules at runtime all share the same set of timers.
 */
@moduleScoped(LocalSchedulingModuleKeyname)
@tag("LocalSchedulerInterface")
@singleton()
@injectable()
export class LocalSchedulerManager implements LocalSchedulerInterface {
  /**
   * The largest delay a single `setTimeout` can represent: 2^31 - 1 milliseconds (~24.8
   * days). Longer waits are chunked into successive timeouts.
   */
  private static readonly MAX_TIMEOUT_DELAY = 2_147_483_647;

  /** Default value for {@link ScheduleOptions.missedExecutionThresholdInMilliseconds}. */
  private static readonly DEFAULT_MISSED_EXECUTION_THRESHOLD_MS = 5000;

  private readonly states: Map<string, ScheduleState> = new Map<string, ScheduleState>();

  /** Every task invocation that has been started and not yet settled — awaited by `stop()`. */
  private readonly inFlightInvocations: Set<Promise<void>> = new Set<Promise<void>>();

  private started: boolean = false;

  /**
   * @param logHandler The log handler used to report skips, task errors, and lifecycle.
   * @param schedulables Every class tagged {@link ServiceDefinitionTagEnum.Schedulable}. Injected optionally, so the
   *   collection is simply empty when none is tagged. They are registered on `start()`.
   *   Defaults to `[]` so the manager can also be constructed directly (e.g. in tests)
   *   without wiring the collection.
   */
  constructor(@inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
              @injectAll(ServiceDefinitionTagEnum.Schedulable, {isOptional: true}) private readonly schedulables: SchedulableInterface[] = []) {
  }

  public get isStarted(): boolean {
    return this.started;
  }

  public schedule(id: string, schedule: ScheduleInterface | string, task: ScheduledTaskFunction, options?: ScheduleOptions): void {
    if (this.states.has(id)) {
      throw new ScheduleAlreadyExistsError(id);
    }

    const state: ScheduleState = {
      id,
      schedule: this.resolveSchedule(schedule),
      task,
      allowOverlap: options?.allowOverlap ?? false,
      catchUp: options?.catchUp ?? false,
      missedExecutionThresholdInMilliseconds: options?.missedExecutionThresholdInMilliseconds ?? LocalSchedulerManager.DEFAULT_MISSED_EXECUTION_THRESHOLD_MS,
      running: false,
    };

    this.states.set(id, state);
    this.logHandler.debug("LocalSchedulerManager: registered a schedule.", {
      extra: {id, schedule: state.schedule.toString(), started: this.started},
    });

    if (this.started) {
      this.arm(state);
    }
  }

  public unschedule(id: string): boolean {
    const state = this.states.get(id);
    if (state === undefined) {
      return false;
    }

    this.clearTimer(state);
    this.states.delete(id);
    this.logHandler.debug("LocalSchedulerManager: removed a schedule.", {extra: {id}});
    return true;
  }

  public reschedule(id: string, schedule: ScheduleInterface | string): void {
    const state = this.states.get(id);
    if (state === undefined) {
      throw new ScheduleNotFoundError(id);
    }

    this.clearTimer(state);
    state.schedule = this.resolveSchedule(schedule);
    state.armedTargetEpoch = undefined;
    state.nextExecutionDate = undefined;

    this.logHandler.debug("LocalSchedulerManager: rescheduled.", {
      extra: {id, schedule: state.schedule.toString()},
    });

    if (this.started) {
      this.arm(state);
    }
  }

  public has(id: string): boolean {
    return this.states.has(id);
  }

  public list(): ScheduleDescriptor[] {
    return Array.from(this.states.values()).map((state) => ({
      id: state.id,
      schedule: state.schedule,
      isRunning: state.running,
      nextExecutionDate: state.nextExecutionDate,
    }));
  }

  public getNextExecutionDate(id: string): Date | undefined {
    const state = this.states.get(id);
    if (state === undefined) {
      throw new ScheduleNotFoundError(id);
    }
    return state.nextExecutionDate ?? state.schedule.getNextExecutionDate(new Date());
  }

  public start(): void {
    if (this.started) {
      return;
    }

    // Register statically-tagged tasks first (while still stopped, so they only register and
    // don't arm yet), then arm everything — tagged and dynamic — in one pass.
    this.registerSchedulables();

    this.started = true;
    this.logHandler.info("LocalSchedulerManager: starting.", {extra: {scheduleCount: this.states.size}});

    for (const state of this.states.values()) {
      this.arm(state);
    }
  }

  public async stop(): Promise<void> {
    this.started = false;

    for (const state of this.states.values()) {
      this.clearTimer(state);
      state.armedTargetEpoch = undefined;
      state.nextExecutionDate = undefined;
    }

    this.logHandler.info("LocalSchedulerManager: stopping; awaiting in-flight tasks.", {
      extra: {inFlightCount: this.inFlightInvocations.size},
    });

    // Timers are already cleared synchronously above, so no new fires occur. We only wait for
    // invocations that were already running to settle, enabling a graceful shutdown.
    await Promise.allSettled(Array.from(this.inFlightInvocations));
  }

  /**
   * Registers each statically-tagged {@link SchedulableInterface} from the schedules it
   * declares. Called once by `start()`. Each task's registration id derives from its class
   * name (suffixed with the schedule index when a task declares more than one schedule). A
   * task whose id is already registered (a collision with a dynamic schedule, or a repeat call
   * after stop→start) is skipped, and a task whose `getSchedules()` throws is logged and
   * skipped — neither prevents the others, or the scheduler, from starting.
   */
  private registerSchedulables(): void {
    for (const schedulable of this.schedulables) {
      const name = schedulable.constructor?.name ?? "Schedulable";

      try {
        const schedules = schedulable.getSchedules();

        schedules.forEach((schedule, index) => {
          const id = schedules.length > 1 ? `${name}#${index}` : name;

          if (this.states.has(id)) {
            this.logHandler.warning("LocalSchedulerManager: a tagged task's id is already registered; skipping it.", {
              extra: {id, task: name},
            });
            return;
          }

          this.schedule(id, schedule, (eventId) => schedulable.run(eventId));
        });
      } catch (error) {
        this.logHandler.error("LocalSchedulerManager: failed to register a tagged task; skipping it.", {
          extra: {
            task: name,
            error: error instanceof Error ? (error.stack ?? error.message) : String(error),
          },
        });
      }
    }
  }

  private resolveSchedule(schedule: ScheduleInterface | string): ScheduleInterface {
    // A string is shorthand for a cron schedule; constructing it validates the expression and
    // propagates an InvalidCronExpressionError (HTTP 400) for malformed input.
    return typeof schedule === "string" ? new CronSchedule(schedule) : schedule;
  }

  /**
   * Computes the next occurrence from now and arms the timer for it. Any existing timer is
   * cleared first.
   */
  private arm(state: ScheduleState): void {
    this.clearTimer(state);
    this.armFrom(state, Date.now());
  }

  /**
   * Computes the next occurrence strictly after `baseEpoch` and arms the timer for it. If the
   * schedule has no upcoming occurrence, it is left unarmed (a one-shot that already fired, or
   * a cron that never matches).
   */
  private armFrom(state: ScheduleState, baseEpoch: number): void {
    const next = state.schedule.getNextExecutionDate(new Date(baseEpoch));
    if (next === undefined) {
      state.armedTargetEpoch = undefined;
      state.nextExecutionDate = undefined;
      // Not an error: a terminal schedule (e.g. an elapsed one-off date) legitimately has no
      // next occurrence. It stays registered and observable via list() with no next date.
      this.logHandler.debug("LocalSchedulerManager: schedule has no upcoming occurrence; leaving it unarmed.", {
        extra: {id: state.id, schedule: state.schedule.toString()},
      });
      return;
    }

    state.armedTargetEpoch = next.getTime();
    state.nextExecutionDate = next;
    this.setChunkedTimeout(state);
  }

  /**
   * Arms a `setTimeout` for the currently-armed target, chunked so it never exceeds the
   * platform maximum. Re-computing the delay from `Date.now()` on each (re-)arm keeps the
   * schedule drift-free.
   */
  private setChunkedTimeout(state: ScheduleState): void {
    const target = state.armedTargetEpoch;
    if (target === undefined) {
      return;
    }

    const delay = target - Date.now();
    const chunk = Math.max(0, Math.min(delay, LocalSchedulerManager.MAX_TIMEOUT_DELAY));
    state.timeout = setTimeout(() => this.onTimer(state), chunk);
  }

  /**
   * Fires when a (possibly chunked) timeout elapses. If the real target is still in the future
   * — because the delay was chunked — it re-arms for the remaining time; otherwise it fires
   * the occurrence.
   */
  private onTimer(state: ScheduleState): void {
    state.timeout = undefined;

    if (!this.started) {
      return;
    }

    const target = state.armedTargetEpoch;
    if (target === undefined) {
      return;
    }

    // A chunked long delay: the target is still ahead, so arm the next chunk. The 1ms
    // tolerance avoids a needless extra timer when we land essentially on the target.
    if (target - Date.now() > 1) {
      this.setChunkedTimeout(state);
      return;
    }

    this.fire(state, target);
  }

  /**
   * Decides whether the occurrence at `target` should run (applying the missed-fire and
   * overlap policies), re-arms for the next occurrence, and executes the task if warranted.
   */
  private fire(state: ScheduleState, target: number): void {
    const now = Date.now();
    const driftMs = now - target;
    const isMissed = driftMs > state.missedExecutionThresholdInMilliseconds;
    const skipBecauseMissed = isMissed && !state.catchUp;
    const skipBecauseOverlap = state.running && !state.allowOverlap;

    // Re-arm for the next future occurrence *before* running the task, from max(now, target):
    // this guarantees monotonic progress (never re-selecting this or an earlier occurrence,
    // even if the timer fired a hair early or very late) and means a long-running task never
    // delays the scheduling of subsequent occurrences.
    this.armFrom(state, Math.max(now, target));

    if (skipBecauseMissed) {
      this.logHandler.info("LocalSchedulerManager: skipped a missed occurrence.", {
        extra: {id: state.id, scheduledFor: new Date(target).toISOString(), driftMs},
      });
      return;
    }

    if (skipBecauseOverlap) {
      this.logHandler.warning("LocalSchedulerManager: skipped an overlapping occurrence (previous invocation still running).", {
        extra: {id: state.id, scheduledFor: new Date(target).toISOString()},
      });
      return;
    }

    this.execute(state, target);
  }

  /**
   * Runs the task, isolating any error so it can never break the scheduling loop, and tracks
   * the invocation so `stop()` can await it. The task receives an `eventId` correlating logs
   * to this specific occurrence.
   */
  private execute(state: ScheduleState, target: number): void {
    state.running = true;

    const scheduledFor = new Date(target).toISOString();
    const eventId = `${state.id}:${scheduledFor}`;

    const invocation: Promise<void> = (async () => {
      try {
        await state.task(eventId);
      } catch (error) {
        this.logHandler.error("LocalSchedulerManager: a scheduled task threw; the schedule continues.", {
          extra: {
            id: state.id,
            scheduledFor,
            error: error instanceof Error ? (error.stack ?? error.message) : String(error),
          },
        });
      } finally {
        state.running = false;
      }
    })();

    this.inFlightInvocations.add(invocation);
    invocation.finally(() => this.inFlightInvocations.delete(invocation));
  }

  private clearTimer(state: ScheduleState): void {
    if (state.timeout !== undefined) {
      clearTimeout(state.timeout);
      state.timeout = undefined;
    }
  }
}
