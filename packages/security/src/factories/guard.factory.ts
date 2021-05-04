import {DependencyContainer, injectable} from "tsyringe";
import {GuardContextInterface} from "../interfaces/guard-context.interface";
import {GuardInterface} from "../interfaces/guard.interface";
import {GuardInitializationError} from "../errors/guard-initialization.error";

@injectable()
export class GuardFactory {
    fromContext(guardContext: GuardContextInterface, container: DependencyContainer): GuardInterface {
        // Check if the guard needs to be instantiated
        let instantiatedGuard: GuardInterface = guardContext.guard as GuardInterface;

        if (typeof instantiatedGuard === 'function') {
            instantiatedGuard = container.resolve(instantiatedGuard);
        }

        // Check again if the class has the isAuthorized method
        if (typeof instantiatedGuard.isAuthorized !== 'function') {
            throw new GuardInitializationError("The guard: '" + instantiatedGuard + "' doesn't implement the isAuthorized() method.");
        }

        // Check again if the class has the setContext method
        if (typeof instantiatedGuard.setContext !== 'function') {
            throw new GuardInitializationError("The guard: '" + instantiatedGuard + "' doesn't implement the setContext() method.");
        }

        return instantiatedGuard;
    }
}
