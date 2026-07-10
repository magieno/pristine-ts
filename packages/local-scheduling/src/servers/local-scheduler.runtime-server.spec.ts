import "reflect-metadata";
import {LocalSchedulerRuntimeServer} from "./local-scheduler.runtime-server";
import {LocalSchedulerInterface} from "../interfaces/local-scheduler.interface";
import {SchedulableTaskManager} from "../managers/schedulable-task.manager";
import {LogHandlerInterface} from "@pristine-ts/logging";

const createLogHandlerMock = (): jest.Mocked<LogHandlerInterface> => ({
  critical: jest.fn(), error: jest.fn(), warning: jest.fn(), notice: jest.fn(),
  info: jest.fn(), success: jest.fn(), debug: jest.fn(), terminate: jest.fn(),
});

const createSchedulerMock = (): jest.Mocked<LocalSchedulerInterface> => ({
  isStarted: false,
  schedule: jest.fn(),
  unschedule: jest.fn(),
  reschedule: jest.fn(),
  has: jest.fn(),
  list: jest.fn(),
  getNextExecutionDate: jest.fn(),
  start: jest.fn(),
  stop: jest.fn().mockResolvedValue(undefined),
});

const createRegistrarMock = () => ({register: jest.fn()}) as unknown as jest.Mocked<SchedulableTaskManager>;

describe("LocalSchedulerRuntimeServer", () => {
  it("exposes a stable name for pristine start diagnostics", () => {
    const server = new LocalSchedulerRuntimeServer(createSchedulerMock(), createRegistrarMock(), createLogHandlerMock());
    expect(server.name).toBe("local-scheduler");
  });

  it("start() registers tagged tasks, then starts the scheduler", async () => {
    const scheduler = createSchedulerMock();
    const registrar = createRegistrarMock();
    const server = new LocalSchedulerRuntimeServer(scheduler, registrar, createLogHandlerMock());

    await server.start();

    expect(registrar.register).toHaveBeenCalledTimes(1);
    expect(scheduler.start).toHaveBeenCalledTimes(1);
    // Registration must happen before arming, so start() arms the tasks it just registered.
    expect(registrar.register.mock.invocationCallOrder[0]).toBeLessThan(scheduler.start.mock.invocationCallOrder[0]);
  });

  it("stop() awaits the scheduler's graceful stop", async () => {
    const scheduler = createSchedulerMock();
    const server = new LocalSchedulerRuntimeServer(scheduler, createRegistrarMock(), createLogHandlerMock());
    await server.stop();
    expect(scheduler.stop).toHaveBeenCalledTimes(1);
  });
});
