import "reflect-metadata";
import {injectable, scoped, Lifecycle, injectAll, inject} from "tsyringe";

@injectable()
@scoped(Lifecycle.ContainerScoped)
export class TracingContext {
    public traceId?: string
}