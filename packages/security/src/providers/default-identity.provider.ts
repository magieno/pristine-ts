import {IdentityInterface, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {SecurityModuleKeyname} from "../security.module.keyname";
import {injectable} from "tsyringe";
import {IdentityProviderInterface} from "../interfaces/identity-provider.interface";

/**
 * Until there's a fix for: https://github.com/microsoft/tsyringe/issues/63
 */
@injectable()
@tag(ServiceDefinitionTagEnum.IdentityProvider)
@moduleScoped(SecurityModuleKeyname)
export class DefaultIdentityProvider implements IdentityProviderInterface {
    provide(identity: IdentityInterface): Promise<IdentityInterface> {
        return Promise.resolve(identity);
    }
}