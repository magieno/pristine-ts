import {LogModel} from "../models/log.model";
import {SeverityEnum} from "../enums/severity.enum";
import {Utils} from "../utils/utils";
import {CommonModuleKeyname} from "@pristine-ts/common";
import {OutputModeEnum} from "../enums/output-mode.enum";

/**
 * The BaseLogger is the base abstract class that all internal loggers should extend.
 * It defines the basic logic that applies to all internal loggers.
 * External loggers could extend the base logger but it is not mandatory.
 */
export abstract class BaseLogger {

    /**
     * The stacked logs are the logs that were not outputted right away but that will need to be outputted if a log with a higher severity arrives.
     * @private
     */
    private stackedLogs: { [key: string]: LogModel[] } = {};

    /**
     * The BaseLogger is the base abstract class that all loggers should extend.
     * It defines the basic logic that applies to all loggers.
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
     * @param spaces The number of spaces to indent the outputted logs.
     */
    constructor(
        protected readonly numberOfStackedLogs: number,
        protected readonly logSeverityLevelConfiguration: number,
        protected readonly logDebugDepthConfiguration: number,
        protected readonly logInfoDepthConfiguration: number,
        protected readonly logWarningDepthConfiguration: number,
        protected readonly logErrorDepthConfiguration: number,
        protected readonly logCriticalDepthConfiguration: number,
        private readonly isActivated = true,
        protected readonly outputMode = OutputModeEnum.Json,
        protected readonly spaces = 2) {
    }

    /**
     * Initializes the logger. To be implemented in each logger.
     * @protected
     */
    protected abstract initialize(): void;

    /**
     * Returns whether this particular logger is active and should output logs.
     */
    public isActive(): boolean {
        return this.isActivated;
    }

    /**
     * Gets the formatted output log based on a log model.
     * @param log The log to be formatted.
     */
    public getFormattedOutputLog(log: LogModel): string {
        switch (log.severity) {
            case SeverityEnum.Debug:
                return Utils.outputLog(log, this.outputMode, this.logDebugDepthConfiguration);

            case SeverityEnum.Info:
                return Utils.outputLog(log, this.outputMode, this.logInfoDepthConfiguration);

            case SeverityEnum.Warning:
                return Utils.outputLog(log, this.outputMode, this.logWarningDepthConfiguration)

            case SeverityEnum.Error:
                return Utils.outputLog(log, this.outputMode, this.logErrorDepthConfiguration)

            case SeverityEnum.Critical:
                return Utils.outputLog(log, this.outputMode, this.logCriticalDepthConfiguration)
        }
    }

    /**
     * Actually outputs the log. To be implemented in each logger.
     * @param log The log to be outputted.
     * @protected
     */
    protected abstract log(log: LogModel): void;

    /**
     * Captures the log and evaluates which logs need to be outputted or stacked.
     * @param log The log to be captured.
     * @protected
     */
    protected captureLog(log: LogModel): void {
        if (this.numberOfStackedLogs > 0) {
            this.setupStackedLogsArrayIfRequired(log.traceId);

            // We only add to the stacked logs if the severity is set to ony show errors. If we show info, we don't want
            // to see a debug every time we print an info. We want that when we have an error and that the configuration
            // is set to error, we want some context and to output the previous logs.
            if (this.logSeverityLevelConfiguration>= SeverityEnum.Error && log.severity < this.logSeverityLevelConfiguration) {
                // We still add a log to the stack to ensure that when there's an error, we log everything.
                this.addStackedLog(log);

                return;
            }

            this.outputStackedLogs();
        }

        if (log.severity >= this.logSeverityLevelConfiguration) {
            this.log(log);
        }
    }

    /**
     * Sets up the stack of logs if it is required.
     * @param traceId Optional trace id to stack logs based on different requests.
     * @private
     */
    private setupStackedLogsArrayIfRequired(traceId?: string) {
        if (this.stackedLogs.hasOwnProperty(CommonModuleKeyname) === false) {
            this.stackedLogs[CommonModuleKeyname] = [];
        }

        if (traceId && this.stackedLogs.hasOwnProperty(traceId) === false) {
            this.stackedLogs[traceId] = this.stackedLogs[CommonModuleKeyname] ?? [];
        }
    }

    /**
     * Adds the log to the stacked logs and makes sure we only keep the right amount of stacked logs.
     * @param log The log to be added.
     * @private
     */
    private addStackedLog(log: LogModel) {
        const stackedLogsKey = log.traceId ?? CommonModuleKeyname;

        // Push the log at the end of the array
        this.stackedLogs[stackedLogsKey].push(log);

        // If the stacked logs is already at the maximum number of logs, we delete the first log.
        if (this.stackedLogs[stackedLogsKey].length >= this.numberOfStackedLogs) {
            do {
                this.stackedLogs[stackedLogsKey].shift();
            } while (this.stackedLogs[stackedLogsKey].length > this.numberOfStackedLogs)
        }
    }

    /**
     * Outputs the stacked logs.
     * @param traceId Optional trace id so that we only output the stacked logs for this trace.
     * @private
     */
    private outputStackedLogs(traceId?: string) {
        for (const log of this.stackedLogs[CommonModuleKeyname]) {
            this.log(log);
        }

        if (traceId === undefined || this.stackedLogs.hasOwnProperty(traceId) === false) {
            return;
        }

        for (const log of this.stackedLogs[traceId]) {
            this.log(log);
        }

        this.clearStackedLogs(traceId);
    }

    /**
     * Clears the stacked logs.
     * @param traceId Optional trace id so that we only remove the stacked logs for this trace.
     * @private
     */
    private clearStackedLogs(traceId?: string) {
        this.stackedLogs[CommonModuleKeyname] = [];

        if (traceId === undefined || this.stackedLogs.hasOwnProperty(traceId) === false) {
            return;
        }

        this.stackedLogs[traceId] = [];
    }
}
