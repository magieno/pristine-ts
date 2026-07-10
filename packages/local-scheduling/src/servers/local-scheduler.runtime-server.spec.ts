import "reflect-metadata";
import {LocalSchedulerRuntimeServer} from "./local-scheduler.runtime-server";
import {LocalSchedulerInterface} from "../interfaces/local-scheduler.interface";
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

describe("LocalSchedulerRuntimeServer", () => {
  it("exposes a stable name for pristine start diagnostics", () => {
    const server = new LocalSchedulerRuntimeServer(createSchedulerMock(), createLogHandlerMock());
    expect(server.name).toBe("local-scheduler");
  });

  it("start() starts the scheduler (arming every tagged task)", async () => {
    const scheduler = createSchedulerMock();
    const server = new LocalSchedulerRuntimeServer(scheduler, createLogHandlerMock());
    await server.start();
    expect(scheduler.start).toHaveBeenCalledTimes(1);
  });

  it("stop() awaits the scheduler's graceful stop", async () => {
    const scheduler = createSchedulerMock();
    const server = new LocalSchedulerRuntimeServer(scheduler, createLogHandlerMock());
    await server.stop();
    expect(scheduler.stop).toHaveBeenCalledTimes(1);
  });
});
