import {DependencyContainer, injectable} from "tsyringe";
import {GuardContextInterface} from "../interfaces/guard-context.interface";
import {GuardInterface} from "../interfaces/guard.interface";
import {GuardInstantiationError} from "../errors/guard-instantiation.error";

/**
 * The GuardFactory returns the proper instantiated guard.
 */
@injectable()
export class GuardFactory {

  /**
   * This function takes the guard context and returns the proper instantiated guard.
   * It also validates that the guard is valid (it implements the GuardInterface).
   * @param guardContext The guard context that contains the guard and the options to use.
   * @param container The dependency container from which to retrieve the instantiated guard.
   */
  fromContext(guardContext: GuardContextInterface, container: DependencyContainer): GuardInterface {
    // Check if the guard needs to be instantiated
    let instantiatedGuard: GuardInterface = guardContext.guard as GuardInterface;

    // ── container.resolve, justified ────────────────────────────────────────────
    // Per CLAUDE.md: this is a factory whose target class is data carried on the
    // route's metadata (the `@guard(SomeGuard)` decorator value). The token isn't
    // known at factory construction; the factory's whole job is to look it up. The
    // per-event child container is passed in by the router so the resolved guard
    // sees the correct request-scoped dependencies.
    if (typeof instantiatedGuard === 'function') {
      instantiatedGuard = container.resolve(instantiatedGuard);
    }

    // Check again if the class has the isAuthorized method
    if (typeof instantiatedGuard.isAuthorized !== 'function') {
      throw new GuardInstantiationError("The guard doesn't implement the isAuthorized() method.", instantiatedGuard, guardContext);
    }

    // Check again if the class has the setContext method
    if (typeof instantiatedGuard.setContext !== 'function') {
      throw new GuardInstantiationError("The guard doesn't implement the setContext() method.", instantiatedGuard, guardContext);
    }

    return instantiatedGuard;
  }
}
