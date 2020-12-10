import "reflect-metadata";
import {container, DependencyContainer, isClassProvider, ValueProvider} from "tsyringe";
import {ModuleInterface} from "./interfaces/module.interface";
import {ProviderRegistration} from "./types/provider-registration.type";
import {InitializationError} from "./errors/initialization.error";
const util = require('util');

export class Kernel {
    public container: DependencyContainer = container;

    public constructor() {}

    public async init(module: ModuleInterface) {
        // Start by recursively importing all the modules
        for (let importedModule of module.importModules) {
            await this.init(importedModule)
        }

        // Add all the providers to the container
        module.providerRegistrations.forEach( (providerRegistration: ProviderRegistration) => {
            const args = [
                providerRegistration.token,
                providerRegistration,
            ];

            if(providerRegistration.hasOwnProperty("options")) {
                args.push(providerRegistration["options"]);
            }

            try {
                // Register the provider in the container
                this.container.register.apply(this.container, args);
            }
            catch (e) {
                throw new InitializationError("There was an error registering the following providerRegistration: " + util.inspect(providerRegistration, false, 4), e)
            }
        })
    }

}