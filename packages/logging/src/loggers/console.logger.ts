import {inject, injectable, singleton } from "tsyringe";
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";
import {LoggerInterface} from "../interfaces/logger.interface";
import {Readable} from "stream";
import * as util from "util";
import {Utils} from "../utils/utils";
import {CommonModuleKeyname, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {OutputModeEnum} from "../enums/output-mode.enum";
import format from "date-fns/format";
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
  public readableStream: Readable;


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
   * @param logErrorDepthConfiguration The number of level to go down in an object when printing a log with the Error severity.
   * We often do not need to go to the bottom layer of an object, so we can truncate at a certain depth.
   * @param logCriticalDepthConfiguration The number of level to go down in an object when printing a log with the Critical severity.
   * We often do not need to go to the bottom layer of an object, so we can truncate at a certain depth.
   * @param isActivated Whether or not this particular logger is activated and should output logs.
   * @param outputMode The output mode, that the logger should use.
   */
  public constructor(@inject("%pristine.logging.numberOfStackedLogs%") numberOfStackedLogs: number,
                     @inject("%pristine.logging.logSeverityLevelConfiguration%") logSeverityLevelConfiguration: number,
                     @inject("%pristine.logging.logDebugDepthConfiguration%") logDebugDepthConfiguration: number,
                     @inject("%pristine.logging.logInfoDepthConfiguration%") logInfoDepthConfiguration: number,
                     @inject("%pristine.logging.logWarningDepthConfiguration%") logWarningDepthConfiguration: number,
                     @inject("%pristine.logging.logErrorDepthConfiguration%") logErrorDepthConfiguration: number,
                     @inject("%pristine.logging.logCriticalDepthConfiguration%") logCriticalDepthConfiguration: number,
                     @inject("%pristine.logging.consoleLoggerActivated%") isActivated: boolean,
                     @inject("%pristine.logging.consoleLoggerOutputMode%") outputMode: OutputModeEnum,
                     ) {
    super(numberOfStackedLogs,
        logSeverityLevelConfiguration,
        logDebugDepthConfiguration,
        logInfoDepthConfiguration,
        logWarningDepthConfiguration,
        logErrorDepthConfiguration,
        logCriticalDepthConfiguration,
        isActivated,
        outputMode);

    this.initialize();
  }

  /**
   * Initializes the console logger.
   * @protected
   */
  protected initialize(){
    if(this.isActive()) {
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

    switch (log.severity) {
      case SeverityEnum.Debug:
        console.debug(outputLog);
        break;

      case SeverityEnum.Info:
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
}
