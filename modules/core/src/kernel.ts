import "reflect-metadata";
import {container, DependencyContainer, isClassProvider, ValueProvider} from "tsyringe";
import {ModuleInterface} from "./interfaces/module.interface";
import {ProviderRegistration} from "./types/provider-registration.type";
import {InitializationError} from "./errors/initialization.error";
import {Event} from "./interfaces/event.interface";
import {Response} from "./network/response";
import {Request} from "./network/request";
import {Router} from "./network/router";
import {controllerRegistry} from "./decorators/controller.decorator";
import {MethodDecoratorRoute} from "./interfaces/method-decorator-route.interface";
const util = require('util');

export class Kernel {
    public container: DependencyContainer = container;

    private router: Router;

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

        // Setup the router
        this.setupRouter();
    }

    public setupRouter() {
        this.router = this.container.resolve(Router);

        // Init the controllers
        controllerRegistry.forEach(controller => {
            let basePath: string = controller.__metadata__?.controller?.basePath;

            if(basePath.endsWith("/")) {
                basePath = basePath.slice(0, basePath.length-1);
            }

            const controllerInstanciationToken = controller.constructor;

            controller.__metadata__?.routes?.forEach( (route: MethodDecoratorRoute) => {

                let path = route.path;

                // Clean the path by removing the first and trailing slashes.
                if(path.startsWith("/")) {
                    path = path.slice(1, path.length);
                }

                if(path.endsWith("/")) {
                    path = path.slice(0, path.length-1);
                }

                // Build the proper path
                const routePath = basePath + "/" + path;

                this.router.register(routePath, route.method, {controllerInstanciationToken, propertyKey: route.propertyKey});
            })
        })
    }

    public async handleEvent(event: Event) {
        // Start by creating a child container and we will use this container to instantiate the dependencies for this event
        const childContainer = this.container.createChildContainer();


        // Return

    }

    public async handleRequest(request: Request): Promise<Response> {
        // Start by creating a child container and we will use this container to instantiate the dependencies for this request
        const childContainer = this.container.createChildContainer();


        // Return

        const response: Response = {request: undefined, status: 0}

        return response;
    }

}