import {Readable, Writable} from "stream";

export class WriterInterface {
  public readableStream: Readable;
  public writableStream: Writable;
}
