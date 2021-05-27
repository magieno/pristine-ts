import {injectable} from "tsyringe";
import { ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {Readable} from "stream";
import {TracerInterface} from "../interfaces/tracer.interface";

/**
 * We need this to have at least one tracer so the @injectAll(ServiceDefinitionTagEnum.Tracer) does not fail
 */
@tag(ServiceDefinitionTagEnum.Tracer)
@injectable()
export class XrayTracer implements TracerInterface {
    spanStartedStream?: Readable = new Readable({
        objectMode: true,
        read(size: number) {
            return true;
        }
    });
    spanEndedStream?: Readable = new Readable({
        objectMode: true,
        read(size: number) {
            return true;
        }
    });
    traceEndedStream?: Readable = new Readable({
        objectMode: true,
        read(size: number) {
            return true;
        }
    });
}

