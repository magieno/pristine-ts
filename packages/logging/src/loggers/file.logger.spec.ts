import "reflect-metadata"
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";
import {FileLogger} from "./file.logger";
import fs from 'fs';
import {OutputModeEnum} from "../enums/output-mode.enum";
import {Utils} from "../utils/utils";


describe("File writer", () => {
  afterEach(async () => {
    // Very import to clear the instances in between executions.
    fs.unlinkSync('./logs.txt');
  })

  const logInfo = new LogModel(SeverityEnum.Info, "Log info");
  logInfo.extra = {
    extra: "extra 1"
  };

  const logDebug = new LogModel(SeverityEnum.Debug, "Log debug");
  logDebug.extra = {
    extra: "extra 1"
  };

  const logWarning = new LogModel(SeverityEnum.Warning, "Log warning");
  logWarning.extra = {
    extra: "extra 1"
  };

  const logError = new LogModel(SeverityEnum.Error, "Log error");
  logError.extra = {
    extra: "extra 1"
  };

  const logCritical = new LogModel(SeverityEnum.Critical, "Log critical");
  logCritical.extra = {
    extra: "extra 1"
  };

  it("should log if configuration level is info and severity is higher", async () => {
    const fileWriter = new FileLogger(
      0,
      SeverityEnum.Info,
      3,
      3,
      3,
      3,
      3,
      true,
      OutputModeEnum.Json,
      false,
      "./logs.txt",
    );


    fileWriter.readableStream.push(logInfo);
    fileWriter.readableStream.push(logDebug);
    fileWriter.readableStream.push(logWarning);
    fileWriter.readableStream.push(logError);
    fileWriter.readableStream.push(logCritical);

    await new Promise(res => setTimeout(res, 1000));

    const file = fs.readFileSync("./logs.txt", {encoding: "utf-8"});
    const logs = file.split(";\n");

    expect(logs[0]).toEqual(Utils.outputLog(logInfo, OutputModeEnum.Json, 10));
    expect(logs[1]).toEqual(Utils.outputLog(logWarning, OutputModeEnum.Json, 10));
    expect(logs[2]).toEqual(Utils.outputLog(logError, OutputModeEnum.Json, 10));
    expect(logs[3]).toEqual(Utils.outputLog(logCritical, OutputModeEnum.Json, 10));

  });

  it("should log if configuration level is debug and severity is higher", async () => {
    const fileWriter = new FileLogger(
      0,
      SeverityEnum.Debug,
      3,
      3,
      3,
      3,
      3,
      true,
      OutputModeEnum.Json,
      false,
      "./logs.txt",
    );

    fileWriter.readableStream.push(logInfo);
    fileWriter.readableStream.push(logDebug);
    fileWriter.readableStream.push(logWarning);
    fileWriter.readableStream.push(logError);
    fileWriter.readableStream.push(logCritical);

    await new Promise(res => setTimeout(res, 1000));

    const file = fs.readFileSync("./logs.txt", {encoding: "utf-8"});
    const logs = file.split(";\n");

    expect(logs[0]).toEqual(Utils.outputLog(logInfo, OutputModeEnum.Json, 10));
    expect(logs[1]).toEqual(Utils.outputLog(logDebug, OutputModeEnum.Json, 10));
    expect(logs[2]).toEqual(Utils.outputLog(logWarning, OutputModeEnum.Json, 10));
    expect(logs[3]).toEqual(Utils.outputLog(logError, OutputModeEnum.Json, 10));
    expect(logs[4]).toEqual(Utils.outputLog(logCritical, OutputModeEnum.Json, 10));
  });

  it("should log if configuration level is warning and severity is higher", async () => {
    const fileWriter = new FileLogger(
      0,
      SeverityEnum.Warning,
      3,
      3,
      3,
      3,
      3,
      true,
      OutputModeEnum.Json,
      false,
      "./logs.txt",
    );

    fileWriter.readableStream.push(logInfo);
    fileWriter.readableStream.push(logDebug);
    fileWriter.readableStream.push(logWarning);
    fileWriter.readableStream.push(logError);
    fileWriter.readableStream.push(logCritical);

    await new Promise(res => setTimeout(res, 1000));

    const file = fs.readFileSync("./logs.txt", {encoding: "utf-8"});
    const logs = file.split(";\n");


    expect(logs[0]).toEqual(Utils.outputLog(logWarning, OutputModeEnum.Json, 10));
    expect(logs[1]).toEqual(Utils.outputLog(logError, OutputModeEnum.Json, 10));
    expect(logs[2]).toEqual(Utils.outputLog(logCritical, OutputModeEnum.Json, 10));
  });

  it("should log if configuration level is error and severity is higher", async () => {
    const fileWriter = new FileLogger(
      0,
      SeverityEnum.Error,
      3,
      3,
      3,
      3,
      3,
      true,
      OutputModeEnum.Json,
      false,
      "./logs.txt",
    );

    fileWriter.readableStream.push(logInfo);
    fileWriter.readableStream.push(logDebug);
    fileWriter.readableStream.push(logWarning);
    fileWriter.readableStream.push(logError);
    fileWriter.readableStream.push(logCritical);

    await new Promise(res => setTimeout(res, 1000));

    const file = fs.readFileSync("./logs.txt", {encoding: "utf-8"});
    const logs = file.split(";\n");

    expect(logs[0]).toEqual(Utils.outputLog(logError, OutputModeEnum.Json, 10));
    expect(logs[1]).toEqual(Utils.outputLog(logCritical, OutputModeEnum.Json, 10));
  });


  it("should log if configuration level is critical and severity is higher", async () => {
    const fileWriter = new FileLogger(
      0,
      SeverityEnum.Critical,
      3,
      3,
      3,
      3,
      3,
      true,
      OutputModeEnum.Json,
      false,
      "./logs.txt",
    );

    fileWriter.readableStream.push(logInfo);
    fileWriter.readableStream.push(logDebug);
    fileWriter.readableStream.push(logWarning);
    fileWriter.readableStream.push(logError);
    fileWriter.readableStream.push(logCritical);

    await new Promise(res => setTimeout(res, 1000));

    const file = fs.readFileSync("./logs.txt", {encoding: "utf-8"});
    const logs = file.split(";\n");

    expect(logs[0]).toEqual(Utils.outputLog(logCritical, OutputModeEnum.Json, 10));
  });

  it("should log stacked logs if log something", async () => {
    const fileWriter = new FileLogger(
      5,
      SeverityEnum.Critical,
      3,
      3,
      3,
      3,
      3,
      true,
      OutputModeEnum.Json,
      false,
      "./logs.txt",
    );

    fileWriter.readableStream.push(logInfo);
    fileWriter.readableStream.push(logDebug);
    fileWriter.readableStream.push(logWarning);
    fileWriter.readableStream.push(logError);
    fileWriter.readableStream.push(logCritical);

    await new Promise(res => setTimeout(res, 1000));

    const file = fs.readFileSync("./logs.txt", {encoding: "utf-8"});
    const logs = file.split(";\n");

    expect(logs[0]).toEqual(Utils.outputLog(logInfo, OutputModeEnum.Json, 10));
    expect(logs[1]).toEqual(Utils.outputLog(logDebug, OutputModeEnum.Json, 10));
    expect(logs[2]).toEqual(Utils.outputLog(logWarning, OutputModeEnum.Json, 10));
    expect(logs[3]).toEqual(Utils.outputLog(logError, OutputModeEnum.Json, 10));
    expect(logs[4]).toEqual(Utils.outputLog(logCritical, OutputModeEnum.Json, 10));
  });

});
