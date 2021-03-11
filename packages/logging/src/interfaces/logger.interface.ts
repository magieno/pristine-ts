import {Readable, Writable} from "stream";

export interface LoggerInterface {
  readableStream: Readable;

  isActive(): boolean;
}
