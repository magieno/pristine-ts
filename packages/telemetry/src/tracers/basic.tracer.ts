import {injectable} from "tsyringe";
import {TracerInterface} from "@pristine-ts/telemetry";
import { ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {Readable} from "stream";


@tag(ServiceDefinitionTagEnum.Tracer)
@injectable()
export class XrayTracer implements TracerInterface {
    spanStartedStream?: Readable = new Readable();
    spanEndedStream?: Readable = new Readable();
    traceEndedStream?: Readable = new Readable();
}

