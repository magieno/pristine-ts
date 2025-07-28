import {inject, injectable} from "tsyringe";
import * as Sentry from "@sentry/node";
import {Readable} from "stream";
import {LoggerInterface, LogModel, SeverityEnum} from "@pristine-ts/logging";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {SentryModuleKeyname} from "../sentry.module.keyname";

/**
 * The SentryLogger captures the logs and sends it to Sentry.
 * It is registered with the tag Logger so that it can be injected along with all the other Loggers.
 * It is module scoped to the Sentry module so that it is only registered if the Sentry module is imported in the app module.
 */
@tag(ServiceDefinitionTagEnum.Logger)
@moduleScoped(SentryModuleKeyname)
@injectable()
export class SentryLogger implements LoggerInterface {

  /**
   * The readable stream from which the logger reads the logs that need to be captured.
   */
  public readableStream?: Readable;

  /**
   * The SentryLogger captures the logs and sends it to Sentry.
   * @param sentryDsn The sentry dsn.
   * @param tagRelease The release to tag the captured logs with.
   * @param sentrySampleRate The sample rate at which logs should be captured. Only a certain percentage of the logs will be sent to Sentry to avoid sending to many logs.
   * Should be between 0 and 1. If no value or a value outside this range is provided, the default value of 0.1 will be used.
   * @param sentryActivated Whether or not logs should be captured and sent to Sentry.
   */
  constructor(@inject("%pristine.sentry.sentryDsn%") private readonly sentryDsn: string,
              @inject("%pristine.sentry.tagRelease%") private readonly tagRelease: string,
              @inject("%pristine.sentry.sentrySampleRate%") private readonly sentrySampleRate?: number,
              @inject("%pristine.sentry.sentryActivated%") private readonly sentryActivated?: boolean) {
    this.initialize();
  }

  /**
   * Terminates the readable stream.
   */
  public terminate() {
    this.readableStream?.destroy();
  }

  /**
   * Initializes the Sentry logger.
   */
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

  /**
   * Whether or not the Sentry logger is activated.
   */
  public isActive(): boolean {
    return this.sentryActivated ?? true;
  }

  /**
   * Captures and sends the log to sentry.
   * @param log The log to capture.
   */
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
            level: 'error',
          });
          break;

        case SeverityEnum.Critical:
          // We always send to Sentry a Critical error
          Sentry.captureMessage(log.message, {
            // user: log.extra.identity,
            extra: log.extra,
            level: 'fatal',
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

  /**
   * Determines whether or not it should send the logs to Sentry based on the sample rate.
   * @private
   */
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
}
