import "reflect-metadata";
import {LocalSchedulerManager} from "./local-scheduler.manager";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {CronSchedule} from "../schedules/cron.schedule";
import {DateSchedule} from "../schedules/date.schedule";
import {InvalidCronExpressionError} from "../errors/invalid-cron-expression.error";
import {ScheduleAlreadyExistsError} from "../errors/schedule-already-exists.error";
import {ScheduleNotFoundError} from "../errors/schedule-not-found.error";

const MAX_TIMEOUT_DELAY = 2_147_483_647;
const MINUTE_MS = 60_000;

const createLogHandlerMock = (): jest.Mocked<LogHandlerInterface> => ({
  critical: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  notice: jest.fn(),
  info: jest.fn(),
  success: jest.fn(),
  debug: jest.fn(),
  terminate: jest.fn(),
});

/** A promise plus its resolver, to hold a task "in-flight" until the test releases it. */
const deferred = (): {promise: Promise<void>, resolve: () => void} => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return {promise, resolve};
};

describe("LocalSchedulerManager", () => {
  let logHandler: jest.Mocked<LogHandlerInterface>;
  let manager: LocalSchedulerManager;
  const startOfYear = new Date(2027, 0, 1, 0, 0, 0).getTime();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(startOfYear);
    logHandler = createLogHandlerMock();
    manager = new LocalSchedulerManager(logHandler);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe("registration API", () => {
    it("tracks registration with has() / list() and reports isStarted", () => {
      expect(manager.isStarted).toBe(false);
      expect(manager.has("a")).toBe(false);

      manager.schedule("a", "* * * * *", jest.fn());
      expect(manager.has("a")).toBe(true);

      const [entry] = manager.list();
      expect(entry).toEqual(expect.objectContaining({id: "a", isRunning: false}));
      expect(entry.schedule.toString()).toBe("* * * * *");

      manager.start();
      expect(manager.isStarted).toBe(true);
    });

    it("throws when scheduling a duplicate id", () => {
      manager.schedule("a", "* * * * *", jest.fn());
      expect(() => manager.schedule("a", "* * * * *", jest.fn())).toThrow(ScheduleAlreadyExistsError);
    });

    it("throws a 400-carrying error when scheduling an invalid expression", () => {
      expect(() => manager.schedule("a", "not a cron", jest.fn())).toThrow(InvalidCronExpressionError);
    });

    it("accepts a ScheduleInterface instance as well as a cron string", () => {
      manager.schedule("obj", new CronSchedule("0 0 * * *"), jest.fn());
      expect(manager.list()[0].schedule.toString()).toBe("0 0 * * *");
    });

    it("unschedule() returns whether something was removed and cancels the timer", () => {
      manager.schedule("a", "* * * * *", jest.fn());
      manager.start();
      expect(manager.unschedule("a")).toBe(true);
      expect(manager.has("a")).toBe(false);
      expect(manager.unschedule("a")).toBe(false);
    });

    it("reschedule() changes the schedule and throws on an unknown id", () => {
      manager.schedule("a", "* * * * *", jest.fn());
      manager.reschedule("a", "0 0 * * *");
      expect(manager.list()[0].schedule.toString()).toBe("0 0 * * *");
      expect(() => manager.reschedule("missing", "* * * * *")).toThrow(ScheduleNotFoundError);
    });

    it("getNextExecutionDate() returns the armed date, and throws on an unknown id", () => {
      const task = jest.fn();
      manager.schedule("a", "* * * * *", task);
      manager.start();
      expect(manager.getNextExecutionDate("a")).toEqual(new Date(2027, 0, 1, 0, 1, 0));
      expect(() => manager.getNextExecutionDate("missing")).toThrow(ScheduleNotFoundError);
    });
  });

  describe("arming & firing", () => {
    it("fires on schedule and re-arms for the next occurrence", async () => {
      const task = jest.fn();
      manager.schedule("m", "* * * * *", task);
      manager.start();

      await jest.advanceTimersByTimeAsync(MINUTE_MS);
      expect(task).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(MINUTE_MS);
      expect(task).toHaveBeenCalledTimes(2); // proves it re-armed
    });

    it("passes an eventId identifying the occurrence to the task", async () => {
      let received: string | undefined;
      const task = jest.fn((eventId?: string) => {
        received = eventId;
      });
      manager.schedule("ctx", "* * * * *", task);
      manager.start();

      await jest.advanceTimersByTimeAsync(MINUTE_MS);
      expect(received).toMatch(/^ctx:\d{4}-\d{2}-\d{2}T/);
    });

    it("fires a one-off DateSchedule once, then leaves it unarmed", async () => {
      const task = jest.fn();
      manager.schedule("once", new DateSchedule(new Date(startOfYear + 2 * MINUTE_MS)), task);
      manager.start();

      await jest.advanceTimersByTimeAsync(2 * MINUTE_MS);
      expect(task).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(60 * MINUTE_MS);
      expect(task).toHaveBeenCalledTimes(1); // never fires again
      expect(manager.getNextExecutionDate("once")).toBeUndefined();
    });

    it("allows scheduling before start() and arms on start", async () => {
      const task = jest.fn();
      manager.schedule("m", "* * * * *", task);

      // Not armed yet.
      await jest.advanceTimersByTimeAsync(5 * MINUTE_MS);
      expect(task).not.toHaveBeenCalled();

      manager.start();
      await jest.advanceTimersByTimeAsync(MINUTE_MS);
      expect(task).toHaveBeenCalledTimes(1);
    });

    it("start() is idempotent", async () => {
      const task = jest.fn();
      manager.schedule("m", "* * * * *", task);
      manager.start();
      manager.start(); // must not double-arm
      await jest.advanceTimersByTimeAsync(MINUTE_MS);
      expect(task).toHaveBeenCalledTimes(1);
    });

    it("does not arm an expression that never matches", () => {
      manager.schedule("never", "0 0 30 2 *", jest.fn());
      manager.start();
      expect(manager.getNextExecutionDate("never")).toBeUndefined();
      expect(logHandler.debug).toHaveBeenCalledWith(
        expect.stringContaining("no upcoming occurrence"),
        expect.anything(),
      );
    });
  });

  describe("chunked long delays", () => {
    it("never arms a single timeout longer than the platform maximum, and still fires", async () => {
      const setTimeoutSpy = jest.spyOn(global, "setTimeout");
      const task = jest.fn();

      // ~59 days out — well beyond the ~24.8 day setTimeout ceiling.
      manager.schedule("far", "0 0 1 3 *", task);
      manager.start();

      const delays = setTimeoutSpy.mock.calls.map((call) => call[1] as number);
      expect(Math.max(...delays)).toBeLessThanOrEqual(MAX_TIMEOUT_DELAY);
      expect(delays.some((delay) => delay === MAX_TIMEOUT_DELAY)).toBe(true); // it chunked

      const durationMs = new Date(2027, 2, 1, 0, 0, 0).getTime() - startOfYear;
      await jest.advanceTimersByTimeAsync(durationMs);
      expect(task).toHaveBeenCalledTimes(1);

      setTimeoutSpy.mockRestore();
    });
  });

  describe("stop()", () => {
    it("cancels all future fires", async () => {
      const task = jest.fn();
      manager.schedule("m", "* * * * *", task);
      manager.start();

      await manager.stop();
      expect(manager.isStarted).toBe(false);

      await jest.advanceTimersByTimeAsync(5 * MINUTE_MS);
      expect(task).not.toHaveBeenCalled();
    });

    it("resolves only once in-flight invocations have settled (graceful drain)", async () => {
      const gate = deferred();
      const task = jest.fn(() => gate.promise);
      manager.schedule("m", "* * * * *", task);
      manager.start();

      await jest.advanceTimersByTimeAsync(MINUTE_MS);
      expect(task).toHaveBeenCalledTimes(1); // in-flight

      let stopResolved = false;
      const stopPromise = manager.stop().then(() => {
        stopResolved = true;
      });

      await Promise.resolve();
      await Promise.resolve();
      expect(stopResolved).toBe(false); // still waiting on the running task

      gate.resolve();
      await stopPromise;
      expect(stopResolved).toBe(true);
    });
  });

  describe("overlap policy", () => {
    it("skips an occurrence when the previous invocation is still running (default)", async () => {
      const gate = deferred();
      const task = jest.fn(() => gate.promise);
      manager.schedule("m", "* * * * *", task);
      manager.start();

      await jest.advanceTimersByTimeAsync(MINUTE_MS); // fire #1 — now in-flight
      expect(task).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(MINUTE_MS); // fire #2 — overlaps, skipped
      expect(task).toHaveBeenCalledTimes(1);
      expect(logHandler.warning).toHaveBeenCalledWith(
        expect.stringContaining("overlapping"),
        expect.anything(),
      );

      gate.resolve();
      await Promise.resolve();
      await jest.advanceTimersByTimeAsync(MINUTE_MS); // fire #3 — no longer running, runs
      expect(task).toHaveBeenCalledTimes(2);
    });

    it("runs concurrently when allowOverlap is true", async () => {
      const task = jest.fn(() => new Promise<void>(() => undefined)); // never settles
      manager.schedule("m", "* * * * *", task, {allowOverlap: true});
      manager.start();

      await jest.advanceTimersByTimeAsync(MINUTE_MS);
      expect(task).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(MINUTE_MS);
      expect(task).toHaveBeenCalledTimes(2); // ran despite the first still in-flight
    });
  });

  describe("missed-fire policy", () => {
    // A fire is "missed" when it runs far later than its scheduled target (host asleep /
    // event-loop stalled). Under fake timers a timeout always fires on-time, so the late
    // wall-clock is injected by mocking Date.now() for the duration of the fire.
    const fireLate = async (lateByMs: number): Promise<void> => {
      const target = startOfYear + MINUTE_MS; // the armed occurrence
      const nowSpy = jest.spyOn(Date, "now").mockReturnValue(target + lateByMs);
      await jest.advanceTimersByTimeAsync(MINUTE_MS);
      nowSpy.mockRestore();
    };

    it("skips missed occurrences by default", async () => {
      const task = jest.fn();
      manager.schedule("m", "* * * * *", task);
      manager.start();

      await fireLate(10 * MINUTE_MS);
      expect(task).not.toHaveBeenCalled();
      expect(logHandler.info).toHaveBeenCalledWith(
        expect.stringContaining("missed"),
        expect.anything(),
      );
    });

    it("still runs a fire that is only slightly late (within tolerance)", async () => {
      const task = jest.fn();
      manager.schedule("m", "* * * * *", task);
      manager.start();

      await fireLate(1000); // 1s late, under the 5s default threshold
      expect(task).toHaveBeenCalledTimes(1);
    });

    it("fires a single catch-up when catchUp is true", async () => {
      const task = jest.fn();
      manager.schedule("m", "* * * * *", task, {catchUp: true});
      manager.start();

      await fireLate(10 * MINUTE_MS);
      expect(task).toHaveBeenCalledTimes(1);
    });
  });

  describe("error isolation", () => {
    it("logs a throwing task and keeps the schedule running", async () => {
      const task = jest.fn(() => {
        throw new Error("boom");
      });
      manager.schedule("m", "* * * * *", task);
      manager.start();

      await jest.advanceTimersByTimeAsync(MINUTE_MS);
      expect(task).toHaveBeenCalledTimes(1);
      expect(logHandler.error).toHaveBeenCalledWith(
        expect.stringContaining("threw"),
        expect.anything(),
      );

      await jest.advanceTimersByTimeAsync(MINUTE_MS);
      expect(task).toHaveBeenCalledTimes(2); // loop not broken
    });

    it("isolates a rejected async task too", async () => {
      const task = jest.fn(() => Promise.reject(new Error("async boom")));
      manager.schedule("m", "* * * * *", task);
      manager.start();

      await jest.advanceTimersByTimeAsync(MINUTE_MS);
      await jest.advanceTimersByTimeAsync(MINUTE_MS);
      expect(task).toHaveBeenCalledTimes(2);
      expect(logHandler.error).toHaveBeenCalledTimes(2);
    });
  });
});
