import {IdentityInterface, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {SecurityModuleKeyname} from "../security.module.keyname";
import {inject, injectable} from "tsyringe";
import {IdentityProviderInterface} from "../interfaces/identity-provider.interface";
import {Breadcrumb, BreadcrumbHandlerInterface} from "@pristine-ts/logging";

/**
 * This default identity provider is here so that there is always at least one service tagged with IdentityProvider
 * Until there's a fix for: https://github.com/microsoft/tsyringe/issues/63
 * It resolves the same identity it is passed.
 */
@injectable()
@tag(ServiceDefinitionTagEnum.IdentityProvider)
@moduleScoped(SecurityModuleKeyname)
export class DefaultIdentityProvider implements IdentityProviderInterface {
    constructor(@inject("BreadcrumbHandlerInterface") private readonly breadcrumbHandler: BreadcrumbHandlerInterface) {
    }

    provide(identity: IdentityInterface): Promise<IdentityInterface> {
        this.breadcrumbHandler.addBreadcrumb(new Breadcrumb("Default identity provider called, this does nothing and is probably a mistake.", {identity}));
        return Promise.resolve(identity);
    }
}
