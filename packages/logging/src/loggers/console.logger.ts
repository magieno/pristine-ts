import {inject, injectable, singleton} from "tsyringe";
import {LoggingConfigurationKeys} from "../logging.configuration-keys";
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";
import {LoggerInterface} from "../interfaces/logger.interface";
import {Readable} from "stream";
import {injectConfig, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {OutputModeEnum} from "../enums/output-mode.enum";
import {StreamEnum} from "../enums/stream.enum";
import {LoggingModuleKeyname} from "../logging.module.keyname";
import {BaseLogger} from "./base.logger";

/**
 * The ConsoleLogger outputs the logs to `process.stdout` / `process.stderr`. Each severity
 * routes to its configured stream via the per-severity `ConsoleLogger<Sev>Stream` keys, so
 * CLI tools can keep stdout clean for piped output while sending problems to stderr.
 *
 * Writes go through `process.{stdout,stderr}.write` directly rather than `console.*` so the
 * stream choice is explicit, configurable, and not subject to whatever the host runtime
 * does with `console.log` (which can be redirected, suppressed, or swallowed in serverless
 * environments).
 *
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

  private readonly streams: Record<SeverityEnum, StreamEnum>;

  /**
   * The ConsoleLogger outputs the logs in the console.
   */
  public constructor(@injectConfig(LoggingConfigurationKeys.NumberOfStackedLogs) numberOfStackedLogs: number,
                     @injectConfig(LoggingConfigurationKeys.LogSeverityLevelConfiguration) logSeverityLevelConfiguration: number,
                     @injectConfig(LoggingConfigurationKeys.LogDebugDepthConfiguration) logDebugDepthConfiguration: number,
                     @injectConfig(LoggingConfigurationKeys.LogInfoDepthConfiguration) logInfoDepthConfiguration: number,
                     @injectConfig(LoggingConfigurationKeys.LogSuccessDepthConfiguration) logSuccessDepthConfiguration: number,
                     @injectConfig(LoggingConfigurationKeys.LogNoticeDepthConfiguration) logNoticeDepthConfiguration: number,
                     @injectConfig(LoggingConfigurationKeys.LogWarningDepthConfiguration) logWarningDepthConfiguration: number,
                     @injectConfig(LoggingConfigurationKeys.LogErrorDepthConfiguration) logErrorDepthConfiguration: number,
                     @injectConfig(LoggingConfigurationKeys.LogCriticalDepthConfiguration) logCriticalDepthConfiguration: number,
                     @injectConfig(LoggingConfigurationKeys.ConsoleLoggerActivated) isActivated: boolean,
                     @injectConfig(LoggingConfigurationKeys.ConsoleLoggerOutputMode) outputMode: OutputModeEnum,
                     @injectConfig(LoggingConfigurationKeys.MaximumLogsPerSecond) private readonly maximumLogsPerSecond: number,
                     @injectConfig(LoggingConfigurationKeys.ConsoleLoggerDebugStream) debugStream: StreamEnum,
                     @injectConfig(LoggingConfigurationKeys.ConsoleLoggerInfoStream) infoStream: StreamEnum,
                     @injectConfig(LoggingConfigurationKeys.ConsoleLoggerSuccessStream) successStream: StreamEnum,
                     @injectConfig(LoggingConfigurationKeys.ConsoleLoggerNoticeStream) noticeStream: StreamEnum,
                     @injectConfig(LoggingConfigurationKeys.ConsoleLoggerWarningStream) warningStream: StreamEnum,
                     @injectConfig(LoggingConfigurationKeys.ConsoleLoggerErrorStream) errorStream: StreamEnum,
                     @injectConfig(LoggingConfigurationKeys.ConsoleLoggerCriticalStream) criticalStream: StreamEnum,
  ) {
    super(numberOfStackedLogs,
      logSeverityLevelConfiguration,
      logDebugDepthConfiguration,
      logInfoDepthConfiguration,
      logSuccessDepthConfiguration,
      logNoticeDepthConfiguration,
      logWarningDepthConfiguration,
      logErrorDepthConfiguration,
      logCriticalDepthConfiguration,
      isActivated,
      outputMode);

    this.streams = {
      [SeverityEnum.Debug]: debugStream,
      [SeverityEnum.Info]: infoStream,
      [SeverityEnum.Success]: successStream,
      [SeverityEnum.Notice]: noticeStream,
      [SeverityEnum.Warning]: warningStream,
      [SeverityEnum.Error]: errorStream,
      [SeverityEnum.Critical]: criticalStream,
    };

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
      this.readableStream = this.createSafeReadableStream();
    }
  }

  /**
   * Outputs the log to the configured stream for its severity.
   * @param log The log to be outputted
   * @protected
   */
  protected log(log: LogModel): void {
    const outputLog = this.getFormattedOutputLog(log);

    if (this.shouldThrottleLogs()) {
      return;
    }

    const target = this.streams[log.severity] === StreamEnum.Stderr ? process.stderr : process.stdout;
    target.write(outputLog + "\n");
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
          process.stderr.write(`Throttling the logs as we are outputting too many logs (${this.maximumLogsPerSecond}) per second.\n`);
        }
        this.currentlyThrottlingLogs = true;

      }
    }

    return this.currentlyThrottlingLogs;
  }
}
