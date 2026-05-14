import {inject, injectable, singleton} from "tsyringe";
import {LoggingConfigurationKeys} from "../logging.configuration-keys";
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";
import {LoggerInterface} from "../interfaces/logger.interface";
import {Readable, Writable} from "stream";
import {injectConfig, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import fs from 'fs';
import {LoggingModuleKeyname} from "../logging.module.keyname";
import {OutputModeEnum} from "../enums/output-mode.enum";
import {BaseLogger} from "./base.logger";

/**
 * The FileLogger outputs the logs into file.
 * It is registered with the tag Logger so that it can be injected along with all the other Loggers.
 * It is module scoped to the logging module so that it is only registered if the logging module is imported.
 */
@moduleScoped(LoggingModuleKeyname)
@singleton()
@tag(ServiceDefinitionTagEnum.Logger)
@injectable()
export class FileLogger extends BaseLogger implements LoggerInterface {

  /**
   * The readable stream from which the logger reads the logs that need to be outputted.
   */
  public readableStream?: Readable;

  /**
   * The writable stream used to write to the file.
   * @private
   */
  public writableStream?: Writable;

  /**
   * The ConsoleLogger outputs the logs in the console.
   * @param numberOfStackedLogs The number of logs to keep in the stack and to print once a log with a high enough severity arrives.
   * @param logSeverityLevelConfiguration The number representing the severity from which logs should be outputted.
   * For example, if this is set to 3, any log that has a severity of Error(3) or critical(4) will be outputted.
   * @param logDebugDepthConfiguration The number of level to go down in an object when printing a log with the Debug severity.
   * We often do not need to go to the bottom layer of an object, so we can truncate at a certain depth.
   * @param logInfoDepthConfiguration The number of level to go down in an object when printing a log with the Info severity.
   * We often do not need to go to the bottom layer of an object, so we can truncate at a certain depth.
   * @param logNoticeDepthConfiguration The number of level to go down in an object when printing a log with the Notice severity.
   * We often do not need to go to the bottom layer of an object, so we can truncate at a certain depth.
   * @param logWarningDepthConfiguration The number of level to go down in an object when printing a log with the Warning severity.
   * We often do not need to go to the bottom layer of an object, so we can truncate at a certain depth.
   * @param logErrorDepthConfiguration The number of level to go down in an object when printing a log with the Error severity.
   * We often do not need to go to the bottom layer of an object, so we can truncate at a certain depth.
   * @param logCriticalDepthConfiguration The number of level to go down in an object when printing a log with the Critical severity.
   * We often do not need to go to the bottom layer of an object, so we can truncate at a certain depth.
   * @param isActivated Whether or not this particular logger is activated and should output logs.
   * @param outputMode The output mode, that the logger should use.
   * @param fileLoggerPretty Whether or not the file logger should prettify the output.
   * @param filePath The file path where to output the log.
   */
  public constructor(@injectConfig(LoggingConfigurationKeys.NumberOfStackedLogs) numberOfStackedLogs: number,
                     @injectConfig(LoggingConfigurationKeys.LogSeverityLevelConfiguration) logSeverityLevelConfiguration: number,
                     @injectConfig(LoggingConfigurationKeys.LogDebugDepthConfiguration) logDebugDepthConfiguration: number,
                     @injectConfig(LoggingConfigurationKeys.LogInfoDepthConfiguration) logInfoDepthConfiguration: number,
                     @injectConfig(LoggingConfigurationKeys.LogNoticeDepthConfiguration) logNoticeDepthConfiguration: number,
                     @injectConfig(LoggingConfigurationKeys.LogWarningDepthConfiguration) logWarningDepthConfiguration: number,
                     @injectConfig(LoggingConfigurationKeys.LogErrorDepthConfiguration) logErrorDepthConfiguration: number,
                     @injectConfig(LoggingConfigurationKeys.LogCriticalDepthConfiguration) logCriticalDepthConfiguration: number,
                     @injectConfig(LoggingConfigurationKeys.FileLoggerActivated) isActivated: boolean,
                     @injectConfig(LoggingConfigurationKeys.FileLoggerOutputMode) outputMode: OutputModeEnum,
                     @injectConfig(LoggingConfigurationKeys.FileLoggerPretty) fileLoggerPretty: boolean,
                     @injectConfig(LoggingConfigurationKeys.FilePath) private readonly filePath: string,
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
      outputMode,
      fileLoggerPretty ? 2 : 0);

    this.initialize();
  }

  /**
   * This will be called when the logger is to be terminated. It must destroy the readable stream.
   */
  terminate(): void {
    this.readableStream?.destroy();
    this.writableStream?.end();
  }

  /**
   * Initializes the file logger, and opens the write stream.
   * @protected
   */
  protected initialize() {
    if (this.isActive()) {
      this.readableStream = this.createSafeReadableStream();
      this.writableStream = fs.createWriteStream(this.filePath);
    }
  }

  /**
   * Outputs the log in the file.
   * @param log The log to be outputted
   * @protected
   */
  protected log(log: LogModel): void {
    if (this.writableStream === undefined) {
      return;
    }

    const outputLog = this.getFormattedOutputLog(log) + ";\n";

    switch (log.severity) {
      case SeverityEnum.Debug:
        this.writableStream.write(outputLog);
        break;

      case SeverityEnum.Info:
        this.writableStream.write(outputLog);
        break;

      case SeverityEnum.Warning:
        this.writableStream.write(outputLog);
        break;

      case SeverityEnum.Error:
        this.writableStream.write(outputLog);
        break;

      case SeverityEnum.Critical:
        this.writableStream.write(outputLog);
        break;
    }
  }
}
