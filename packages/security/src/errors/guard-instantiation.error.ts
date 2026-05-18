import {PristineError} from "@pristine-ts/common";
import {GuardInterface} from "../interfaces/guard.interface";

/**
 * This Error is thrown when there's an error that happens when the guards ere being initialized
 */
export class GuardInstantiationError extends PristineError {
  public constructor(message: string, instantiatedGuard: GuardInterface | Function, guardContext: any) {
    super(message, {details: {
      instantiatedGuard,
      guardContext,
    }});  }
}
