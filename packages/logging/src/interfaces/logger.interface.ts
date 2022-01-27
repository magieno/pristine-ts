import {Readable} from "stream";

/**
 * This interface defines what should be implemented by a Logger.
 * A logger is a class that defines how logs should be outputted.
 * For example, an application could have multiple active loggers, one to output in the console, one to output in a file, etc.
 */
export interface LoggerInterface {

  /**
   * The readable stream from which the logger reads the logs that need to be outputted.
   */
  readableStream?: Readable;

  /**
   * Returns whether or not this particular logger is active and should ouput logs.
   */
  isActive(): boolean;

  /**
   * This will be called when the logger is to be terminated.
   */
  terminate(): void;
}
