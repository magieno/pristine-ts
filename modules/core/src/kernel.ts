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
import {RouteInformation} from "./network/route-information";
const util = require('util');

export class Kernel {
    public container: DependencyContainer = container;

    private router: Router;

    public constructor() {}

    public async init(module: ModuleInterface) {
        await this.initModule(module);

        // Setup the router
        this.setupRouter();
    }

    private async initModule(module: ModuleInterface) {
        // Start by recursively importing all the modules
        for (let importedModule of module.importModules) {
            await this.initModule(importedModule)
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

    private setupRouter() {
        this.router = this.container.resolve(Router);

        // Init the controllers
        controllerRegistry.forEach(controller => {
            let basePath: string = controller.__metadata__?.controller?.basePath;

            if(basePath.endsWith("/")) {
                basePath = basePath.slice(0, basePath.length-1);
            }

            for (const methodPropertyKey in controller.__metadata__?.methods) {
                if(controller.__metadata__?.methods?.hasOwnProperty(methodPropertyKey) === false) {
                    continue;
                }

                const method = controller.__metadata__?.methods[methodPropertyKey];

                if(method.hasOwnProperty("route") === false) {
                    continue;
                }

                // Retrieve the "MethodDecoratorRoute" object assigned by the @route decorator at .route
                const route: MethodDecoratorRoute = method.route;

                // Build the RouteInformation object that will be used the the router to dispatch a request to
                // the appropriate controller method
                const routeInformation: RouteInformation = new RouteInformation(controller.constructor, route.propertyKey);
                routeInformation.methodArguments = method.arguments ?? [];

                // Build the proper path
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

                // Register the route
                this.router.register(routePath, route.httpMethod, routeInformation);
            }
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

        // Execute all the request interceptors

        const response = await this.router.execute(request, childContainer);

        // Execute all the response interceptors

        // Return the response
        return response;
    }

}