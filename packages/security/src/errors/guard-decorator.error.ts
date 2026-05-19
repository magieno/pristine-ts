import {PristineError} from "@pristine-ts/common";
import {GuardInterface} from "../interfaces/guard.interface";

/**
 * This Error is thrown when there's an error that happens when the guards ere being initialized
 */
export class GuardDecoratorError extends PristineError {

  public constructor(message: string, guard: GuardInterface | Function, options: any, target: any,
                     propertyKey?: string,
                     descriptor?: PropertyDescriptor) {
    super(message, {details: {
      message,
      guard,
      options,
      target,
      propertyKey,
      descriptor,
    }});  }
}
