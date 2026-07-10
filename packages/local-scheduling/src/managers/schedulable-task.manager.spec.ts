import "reflect-metadata";
import {SchedulableTaskManager} from "./schedulable-task.manager";
import {LocalSchedulerManager} from "./local-scheduler.manager";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {SchedulableInterface} from "../interfaces/schedulable.interface";
import {ScheduleInterface} from "../interfaces/schedule.interface";
import {ScheduledTaskFunction} from "../types/scheduled-task-function.type";
import {CronSchedule} from "../schedules/cron.schedule";
import {DateSchedule} from "../schedules/date.schedule";

const MINUTE_MS = 60_000;

const createLogHandlerMock = (): jest.Mocked<LogHandlerInterface> => ({
  critical: jest.fn(), error: jest.fn(), warning: jest.fn(), notice: jest.fn(),
  info: jest.fn(), success: jest.fn(), debug: jest.fn(), terminate: jest.fn(),
});

/**
 * Builds a {@link SchedulableInterface} whose class name is `name` — the registrar derives a
 * tagged task's registration id from its class name, so a real named class (not a plain object
 * literal, whose `constructor.name` is `"Object"`) is what a test needs.
 */
const makeSchedulable = (name: string, schedules: ScheduleInterface[], runFn: ScheduledTaskFunction = jest.fn()): SchedulableInterface => {
  const ctor = ({
    [name]: class implements SchedulableInterface {
      getSchedules(): ScheduleInterface[] {
        return schedules;
      }
      run(eventId?: string): Promise<void> {
        return Promise.resolve(runFn(eventId));
      }
    },
  } as Record<string, new () => SchedulableInterface>)[name];
  return new ctor();
};

describe("SchedulableTaskManager", () => {
  let logHandler: jest.Mocked<LogHandlerInterface>;
  let scheduler: LocalSchedulerManager;
  const startOfYear = new Date(2027, 0, 1, 0, 0, 0).getTime();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(startOfYear);
    logHandler = createLogHandlerMock();
    scheduler = new LocalSchedulerManager(logHandler);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("registers tagged tasks into the scheduler, keyed by class name", async () => {
    const run = jest.fn();
    const registrar = new SchedulableTaskManager(logHandler, scheduler, [makeSchedulable("nightly", [new CronSchedule("* * * * *")], run)]);

    expect(scheduler.has("nightly")).toBe(false); // register(), not the constructor, registers
    registrar.register();
    expect(scheduler.has("nightly")).toBe(true);

    scheduler.start();
    await jest.advanceTimersByTimeAsync(MINUTE_MS);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0][0]).toMatch(/^nightly:/); // eventId
  });

  it("registers with the declared schedule", () => {
    const registrar = new SchedulableTaskManager(logHandler, scheduler, [makeSchedulable("hourly", [new CronSchedule("0 * * * *")])]);
    registrar.register();
    scheduler.start();
    expect(scheduler.getNextExecutionDate("hourly")).toEqual(new Date(2027, 0, 1, 1, 0, 0));
  });

  it("registers one id per schedule when a task declares several, suffixing the id", async () => {
    const run = jest.fn();
    const registrar = new SchedulableTaskManager(logHandler, scheduler, [
      makeSchedulable("multi", [new CronSchedule("0 * * * *"), new DateSchedule(new Date(startOfYear + 2 * MINUTE_MS))], run),
    ]);
    registrar.register();
    scheduler.start();

    expect(scheduler.has("multi#0")).toBe(true);
    expect(scheduler.has("multi#1")).toBe(true);

    await jest.advanceTimersByTimeAsync(2 * MINUTE_MS); // only the DateSchedule (#1) is due
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0][0]).toMatch(/^multi#1:/);
  });

  it("works with no tagged tasks (optional injection)", () => {
    const registrar = new SchedulableTaskManager(logHandler, scheduler, []);
    expect(() => registrar.register()).not.toThrow();
    expect(scheduler.list()).toEqual([]);
  });

  it("skips a tagged task whose id collides with an existing schedule (existing wins)", async () => {
    const dynamicRun = jest.fn();
    const taggedRun = jest.fn();
    scheduler.schedule("Report", "* * * * *", dynamicRun); // pre-existing dynamic schedule, same id
    const registrar = new SchedulableTaskManager(logHandler, scheduler, [makeSchedulable("Report", [new CronSchedule("* * * * *")], taggedRun)]);

    registrar.register();
    scheduler.start();

    await jest.advanceTimersByTimeAsync(MINUTE_MS);
    expect(dynamicRun).toHaveBeenCalledTimes(1);
    expect(taggedRun).not.toHaveBeenCalled();
    expect(logHandler.warning).toHaveBeenCalledWith(
      expect.stringContaining("already registered"),
      expect.anything(),
    );
  });

  it("isolates a tagged task whose getSchedules() throws, still registering the others", () => {
    const bad: SchedulableInterface = new (class Bad implements SchedulableInterface {
      getSchedules(): ScheduleInterface[] {
        throw new Error("bad schedules");
      }
      run = jest.fn();
    })();
    const registrar = new SchedulableTaskManager(logHandler, scheduler, [bad, makeSchedulable("good", [new CronSchedule("* * * * *")])]);

    registrar.register();
    expect(scheduler.has("good")).toBe(true);
    expect(logHandler.error).toHaveBeenCalledWith(
      expect.stringContaining("failed to register a tagged task"),
      expect.anything(),
    );
  });

  it("isolates a tagged task whose schedule is an invalid cron expression", () => {
    const invalid: SchedulableInterface = new (class Invalid implements SchedulableInterface {
      getSchedules(): ScheduleInterface[] {
        return [new CronSchedule("not a cron")]; // throws during construction
      }
      run = jest.fn();
    })();
    const registrar = new SchedulableTaskManager(logHandler, scheduler, [invalid, makeSchedulable("good", [new CronSchedule("* * * * *")])]);

    registrar.register();
    expect(scheduler.has("good")).toBe(true);
    expect(scheduler.has("Invalid")).toBe(false);
    expect(logHandler.error).toHaveBeenCalledWith(
      expect.stringContaining("failed to register a tagged task"),
      expect.anything(),
    );
  });

  it("is idempotent — a second register() skips already-registered ids", () => {
    const registrar = new SchedulableTaskManager(logHandler, scheduler, [makeSchedulable("nightly", [new CronSchedule("* * * * *")])]);

    registrar.register();
    registrar.register();

    expect(scheduler.list().filter((descriptor) => descriptor.id === "nightly")).toHaveLength(1);
    expect(logHandler.warning).toHaveBeenCalledWith(
      expect.stringContaining("already registered"),
      expect.anything(),
    );
  });
});
