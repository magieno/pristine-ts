import {ConfigurationDefinitionInterface} from "../interfaces/configuration-definition.interface";

export class ConfigurationDefinition implements ConfigurationDefinitionInterface{
    algorithm: string = "HS256";
    publicKey: string = "SHOULD_BE_DEFINED";
    privateKey?: string = undefined;
    passphrase?: string = undefined;
}