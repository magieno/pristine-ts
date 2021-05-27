import {injectable} from "tsyringe";
import {TracerInterface} from "@pristine-ts/telemetry";
import { ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {Readable} from "stream";

/**
 * We need this to have at least one tracer so the @injectAll(ServiceDefinitionTagEnum.Tracer) does not fail
 */
@tag(ServiceDefinitionTagEnum.Tracer)
@injectable()
export class XrayTracer implements TracerInterface {
    spanStartedStream?: Readable = new Readable();
    spanEndedStream?: Readable = new Readable();
    traceEndedStream?: Readable = new Readable();
}

