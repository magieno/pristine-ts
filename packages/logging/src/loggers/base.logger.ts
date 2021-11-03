import {LogModel} from "../models/log.model";
import {SeverityEnum} from "../enums/severity.enum";
import {Utils} from "../utils/utils";
import {CommonModuleKeyname} from "@pristine-ts/common";
import {Readable} from "stream";
import {OutputModeEnum} from "../enums/output-mode.enum";

export abstract class BaseLogger {
    private stackedLogs: { [key: string]: LogModel[] } = {};

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

    protected abstract initialize();

    public isActive(): boolean {
        return this.isActivated;
    }

    public outputLog(log: LogModel): string {
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

    protected abstract log(log: LogModel): void;

    protected captureLog(log: LogModel): void {
        if (this.numberOfStackedLogs > 0) {
            this.setupStackedLogsArrayIfRequired(log.traceId);

            if (log.severity < this.logSeverityLevelConfiguration) {
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

    private setupStackedLogsArrayIfRequired(traceId?: string) {
        if (this.stackedLogs.hasOwnProperty(CommonModuleKeyname) === false) {
            this.stackedLogs[CommonModuleKeyname] = [];
        }

        if (traceId && this.stackedLogs.hasOwnProperty(traceId) === false) {
            this.stackedLogs[traceId] = this.stackedLogs[CommonModuleKeyname] ?? [];
        }
    }

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

    private clearStackedLogs(traceId?: string) {
        this.stackedLogs[CommonModuleKeyname] = [];

        if (traceId === undefined || this.stackedLogs.hasOwnProperty(traceId) === false) {
            return;
        }

        this.stackedLogs[traceId] = [];
    }
}