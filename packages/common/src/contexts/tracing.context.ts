import "reflect-metadata";
import {injectable, Lifecycle, scoped} from "tsyringe";

@injectable()
@scoped(Lifecycle.ContainerScoped)
export class TracingContext {
  public traceId?: string
}