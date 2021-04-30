import {injectable, inject} from "tsyringe";
import * as Sentry from "@sentry/node";
import {Severity as SentrySeverity} from "@sentry/node";
import {Readable, Writable} from "stream";
import {LogModel, SeverityEnum, LoggerInterface} from "@pristine-ts/logging";
import {moduleScoped} from "@pristine-ts/common";
import {SentryModule} from "../sentry.module";

@moduleScoped(SentryModule.keyname)
@injectable()
export class SentryLogger implements LoggerInterface {
    public readableStream: Readable;

    constructor(@inject("%pristine.sentry.sentryDsn%") private readonly sentryDsn: string,
                @inject("%pristine.sentry.tagRelease%") private readonly tagRelease?: string,
                @inject("%pristine.sentry.sentrySampleRate%") private readonly sentrySampleRate?: number,
                @inject("%pristine.sentry.sentryActivated%") private readonly sentryActivated?: boolean) {
        this.initialize();
    }

    public initialize() {
        if (this.isActive() === false) {
            return;
        }

        Sentry.init({
            dsn: this.sentryDsn,
            environment: process.env.NODE_ENV,
            release: this.tagRelease ?? "",
        });

        this.readableStream = new Readable({
            objectMode: true,
            read(size: number) {
                return true;
            }
        });
        this.readableStream.on('data', async chunk => {
            await this.capture(chunk);
        });
    }

    private shouldSendToSentry(): boolean {
        // We capture by default only 10% of all the events.
        let sampleRate = this.sentrySampleRate ?? 0.1;

        // The sample rate must be between 0 and 1. If it's outside these bounds, reset it to the default value;
        if (sampleRate < 0 || sampleRate > 1) {
            sampleRate = 0.1;
        }

        // Generate a random number between 0 and 1
        const randomNumber = Math.random();

        // If the random number generated is smaller or equal to the sample rate, then we want to send to Sentry.
        return randomNumber <= sampleRate;
    }

    public isActive(): boolean {
        return this.sentryActivated ?? true;
    }

    public async capture(log: LogModel): Promise<void> {
        if (this.isActive() === false) {
            return;
        }

        try {
            console.log("Sending to Sentry");

            switch (log.severity) {
                case SeverityEnum.Error:
                    // If we shouldn't sent it to sentry, we return
                    if (this.shouldSendToSentry() === false) {
                        return;
                    }

                    Sentry.captureMessage(log.message, {
                        // user: log.extra.identity,
                        extra: log.extra,
                        level: SentrySeverity.Error,
                    });
                    break;

                case SeverityEnum.Critical:
                    // We always send to Sentry a Critical error
                    Sentry.captureMessage(log.message, {
                        // user: log.extra.identity,
                        extra: log.extra,
                        level: SentrySeverity.Critical,
                    });
                    break;
            }

            await Sentry.flush(2000);
        } catch (error) {
            console.error("There was an error sending to Sentry.");
            console.error(error);
        }
        return;
    }
}
