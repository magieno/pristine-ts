import {injectable, scoped, Lifecycle} from "tsyringe";
import {Span} from "../models/span.model";

@scoped(Lifecycle.ContainerScoped)
@injectable()
export class TracingManager {
    createTrace() {

    }

    startSpan(name: string,): Span {
        const span = new Span();


        return span;
    }
}