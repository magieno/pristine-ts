import {DependencyContainer, injectable} from "tsyringe";
import {GuardContextInterface} from "../interfaces/guard-context.interface";
import {GuardInterface} from "../interfaces/guard.interface";
import {GuardDecoratorError} from "../errors/guard-decorator.error";
import {GuardInstantiationError} from "../errors/guard-instantiation.error";

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
            throw new GuardInstantiationError("The guard doesn't implement the isAuthorized() method.", instantiatedGuard, guardContext);
        }

        // Check again if the class has the setContext method
        if (typeof instantiatedGuard.setContext !== 'function') {
            throw new GuardInstantiationError("The guard doesn't implement the setContext() method.", instantiatedGuard, guardContext);
        }

        return instantiatedGuard;
    }
}
