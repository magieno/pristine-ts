import {DependencyContainer, injectable} from "tsyringe";
import {GuardContextInterface} from "../interfaces/guard-context.interface";
import {GuardInterface} from "../interfaces/guard.interface";
import {LogHandler} from "@pristine-ts/logging";
import {GuardInitializationError} from "../errors/guard-initialization.error";
import {IdentityInterface, RequestInterface, tag} from "@pristine-ts/common";
import {AuthorizerManagerInterface} from "../interfaces/authorizer-manager.interface";
import {GuardFactory} from "../factories/guard.factory";

@tag("AuthorizerManagerInterface")
@injectable()
export class AuthorizerManager implements AuthorizerManagerInterface {
    public constructor(private readonly logHandler: LogHandler, private readonly guardFactory: GuardFactory) {
    }

    public async isAuthorized(requestInterface: RequestInterface, routeContext: any, container: DependencyContainer, identity?: IdentityInterface): Promise<boolean> {
        // If there are no guards defined, we simply return that it is authorized.
        if(!routeContext || routeContext.guards === undefined || Array.isArray(routeContext.guards) === false) {
            return Promise.resolve(true);
        }

        let isAuthorized = true;

        for (const guardContext of routeContext.guards) {
            try {
                const instantiatedGuard = this.guardFactory.fromContext(guardContext, container);

                await instantiatedGuard.setContext(guardContext);

                isAuthorized = isAuthorized && await instantiatedGuard.isAuthorized(requestInterface, identity);
            }
            catch (e) {
                this.logHandler.error(e.message);
                isAuthorized = false;
            }
        }

        return Promise.resolve(isAuthorized);
    }
}
