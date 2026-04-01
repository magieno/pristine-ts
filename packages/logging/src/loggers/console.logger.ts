import {inject, injectable, singleton} from "tsyringe";
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";
import {LoggerInterface} from "../interfaces/logger.interface";
import {Readable} from "stream";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {OutputModeEnum} from "../enums/output-mode.enum";
import {LoggingModuleKeyname} from "../logging.module.keyname";
import {BaseLogger} from "./base.logger";

/**
 * The ConsoleLogger outputs the logs in the console.
 * It is registered with the tag Logger so that it can be injected along with all the other Loggers.
 * It is module scoped to the logging module so that it is only registered if the logging module is imported.
 */
@moduleScoped(LoggingModuleKeyname)
@singleton()
@tag(ServiceDefinitionTagEnum.Logger)
@injectable()
export class ConsoleLogger extends BaseLogger implements LoggerInterface {

  /**
   * The readable stream from which the logger reads the logs that need to be outputted.
   */
  public readableStream?: Readable;

  private currentSecond = -1;

  private numberOfLogsInThisSecond = 0;

  private currentlyThrottlingLogs = false;

  /**
   * The ConsoleLogger outputs the logs in the console.
   * @param numberOfStackedLogs The number of logs to keep in the stack and to print once a log with a high enough severity arrives.
   * @param logSeverityLevelConfiguration The number representing the severity from which logs should be outputted.
   * For example, if this is set to 3, any log that has a severity of Error(3) or critical(4) will be outputted.
   * @param logDebugDepthConfiguration The number of level to go down in an object when printing a log with the Debug severity.
   * We often do not need to go to the bottom layer of an object, so we can truncate at a certain depth.
   * @param logInfoDepthConfiguration The number of level to go down in an object when printing a log with the Info severity.
   * We often do not need to go to the bottom layer of an object, so we can truncate at a certain depth.
   * @param logWarningDepthConfiguration The number of level to go down in an object when printing a log with the Warning severity.
   * We often do not need to go to the bottom layer of an object, so we can truncate at a certain depth.
   * @param logNoticeDepthConfiguration The number of level to go down in an object when printing a log with the Notice severity.
   * We often do not need to go to the bottom layer of an object, so we can truncate at a certain depth.
   * @param logErrorDepthConfiguration The number of level to go down in an object when printing a log with the Error severity.
   * We often do not need to go to the bottom layer of an object, so we can truncate at a certain depth.
   * @param logCriticalDepthConfiguration The number of level to go down in an object when printing a log with the Critical severity.
   * We often do not need to go to the bottom layer of an object, so we can truncate at a certain depth.
   * @param isActivated Whether or not this particular logger is activated and should output logs.
   * @param outputMode The output mode, that the logger should use.
   * @param maximumLogsPerSecond The maximum numner of logs per second that can be outputted
   */
  public constructor(@inject("%pristine.logging.numberOfStackedLogs%") numberOfStackedLogs: number,
                     @inject("%pristine.logging.logSeverityLevelConfiguration%") logSeverityLevelConfiguration: number,
                     @inject("%pristine.logging.logDebugDepthConfiguration%") logDebugDepthConfiguration: number,
                     @inject("%pristine.logging.logInfoDepthConfiguration%") logInfoDepthConfiguration: number,
                     @inject("%pristine.logging.logNoticeDepthConfiguration%") logNoticeDepthConfiguration: number,
                     @inject("%pristine.logging.logWarningDepthConfiguration%") logWarningDepthConfiguration: number,
                     @inject("%pristine.logging.logErrorDepthConfiguration%") logErrorDepthConfiguration: number,
                     @inject("%pristine.logging.logCriticalDepthConfiguration%") logCriticalDepthConfiguration: number,
                     @inject("%pristine.logging.consoleLoggerActivated%") isActivated: boolean,
                     @inject("%pristine.logging.consoleLoggerOutputMode%") outputMode: OutputModeEnum,
                     @inject("%pristine.logging.maximumLogsPerSecond%") private readonly maximumLogsPerSecond: number,
  ) {
    super(numberOfStackedLogs,
      logSeverityLevelConfiguration,
      logDebugDepthConfiguration,
      logInfoDepthConfiguration,
      logNoticeDepthConfiguration,
      logWarningDepthConfiguration,
      logErrorDepthConfiguration,
      logCriticalDepthConfiguration,
      isActivated,
      outputMode);

    this.initialize();
  }

  /**
   * This will be called when the logger is to be terminated. It must destroy the readable stream.
   */
  terminate(): void {
    this.readableStream?.destroy();
  }

  /**
   * Initializes the console logger.
   * @protected
   */
  protected initialize() {
    if (this.isActive()) {
      this.readableStream = new Readable({
        objectMode: true,
        read(size: number) {
          return true;
        }
      });
      this.readableStream.on('data', chunk => {
        this.captureLog(chunk);
      });
    }
  }

  /**
   * Outputs the log in the console.
   * @param log The log to be outputted
   * @protected
   */
  protected log(log: LogModel): void {
    const outputLog = this.getFormattedOutputLog(log);

    if (this.shouldThrottleLogs()) {
      return;
    }

    switch (log.severity) {
      case SeverityEnum.Debug:
        console.debug(outputLog);
        break;

      case SeverityEnum.Info:
        console.info(outputLog);
        break;

      case SeverityEnum.Notice:
        console.info(outputLog);
        break;

      case SeverityEnum.Warning:
        console.warn(outputLog);
        break;

      case SeverityEnum.Error:
        console.error(outputLog);
        break;

      case SeverityEnum.Critical:
        console.error(outputLog);
        break;
    }
  }

  private shouldThrottleLogs() {
    const now = new Date().getSeconds();
    if (this.currentSecond !== now) {
      this.currentSecond = now;
      this.numberOfLogsInThisSecond = 1;
      this.currentlyThrottlingLogs = false;
    } else {
      this.numberOfLogsInThisSecond++;
      if (this.numberOfLogsInThisSecond > this.maximumLogsPerSecond) {
        if (!this.currentlyThrottlingLogs) {
          console.error(`Throttling the logs as we are outputting too many logs (${this.maximumLogsPerSecond}) per second.`);
        }
        this.currentlyThrottlingLogs = true;

      }
    }

    return this.currentlyThrottlingLogs;
  }
}
