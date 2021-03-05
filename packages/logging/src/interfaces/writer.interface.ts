import {Readable, Writable} from "stream";

export interface WriterInterface {
  readableStream: Readable;

  isActive(): boolean;
}
