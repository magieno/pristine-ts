import {DependencyContainer, inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {IdentityInterface, moduleScoped, tag} from "@pristine-ts/common";
import {AuthorizerManagerInterface} from "../interfaces/authorizer-manager.interface";
import {GuardFactory} from "../factories/guard.factory";
import {SecurityModuleKeyname} from "../security.module.keyname";
import {Request} from "@pristine-ts/common";

@moduleScoped(SecurityModuleKeyname)
@tag("AuthorizerManagerInterface")
@injectable()
export class AuthorizerManager implements AuthorizerManagerInterface {
    public constructor(@inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
                       private readonly guardFactory: GuardFactory) {
    }

    public async isAuthorized(request: Request, routeContext: any, container: DependencyContainer, identity?: IdentityInterface): Promise<boolean> {
        // If there are no guards defined, we simply return that it is authorized.
        if(!routeContext || routeContext.guards === undefined || Array.isArray(routeContext.guards) === false) {
            return true;
        }

        let isAuthorized = true;

        for (const guardContext of routeContext.guards) {
            try {
                const instantiatedGuard = this.guardFactory.fromContext(guardContext, container);

                await instantiatedGuard.setContext(guardContext);

                const didAuthorize= await instantiatedGuard.isAuthorized(request, identity);
                isAuthorized = isAuthorized && didAuthorize;
            }
            catch (e) {
                this.logHandler.error(e.message, SecurityModuleKeyname);
                isAuthorized = false;
            }
        }

        return isAuthorized;
    }
}
