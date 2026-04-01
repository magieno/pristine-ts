import "reflect-metadata"
import {DependencyContainer, inject, singleton} from "tsyringe";
import {UrlUtil} from "./utils/url.util";
import {NotFoundHttpError} from "./errors/not-found.http-error";
import {RouterInterface} from "./interfaces/router.interface";
import {RouterNode} from "./nodes/router.node";
import {PathRouterNode} from "./nodes/path-router.node";
import {Route} from "./models/route";
import {MethodRouterNode} from "./nodes/method-router.node";
import {ForbiddenHttpError} from "./errors/forbidden.http-error";
import {ControllerMethodParameterDecoratorResolver} from "./resolvers/controller-method-parameter-decorator.resolver";
import {
  HttpMethod,
  IdentityInterface,
  MetadataEnum,
  MetadataUtil,
  Request,
  Response,
  ServiceDefinitionTagEnum,
  tag,
} from "@pristine-ts/common";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {AuthenticationManagerInterface, AuthorizerManagerInterface} from "@pristine-ts/security";
import {SpanKeynameEnum, TracingManagerInterface} from "@pristine-ts/telemetry";
import {controllerRegistry} from "./decorators/controller.decorator";
import {RouteMethodDecorator} from "./interfaces/route-method-decorator.interface";
import {mergeWith} from "lodash";
import {RequestInterceptorInterface} from "./interfaces/request-interceptor.interface";
import {HttpError} from "./errors/http.error";
import {CachedRouterRoute} from "./cache/cached.router-route";
import {RouterCache} from "./cache/router.cache";
import {ClassMetadata, MethodMetadata} from "@pristine-ts/metadata";
import {RequestInterceptorPriorityEnum} from "./enums/request-interceptor-priority.enum";

/**
 * The router service is the service that creates the routing tree from the controllers.
 * It also executes a request properly by routing it to the intended controller and returns the response.
 */
@tag("RouterInterface")
@singleton()
export class Router implements RouterInterface {
  private root: RouterNode = new PathRouterNode("/");

  // This property is used to track whether the router has been already been properly instantiated or not.
  private setupCompleted = false;

  /**
   * The router service is the service that creates the routing tree from the controllers.
   * It also executes a request properly by routing it to the intended controller and returns the response.
   * @param loghandler The log handler
   * @param cache The cache that optimizes the response time by caching frequent requests.
   * @param controllerMethodParameterDecoratorResolver The controller method parameter decorator resolver used to resolve the values.
   * @param authorizerManager The authorizer manager to validate authorization.
   * @param authenticationManager The authentication manager to validate authentication.
   */
  public constructor(@inject("LogHandlerInterface") private readonly loghandler: LogHandlerInterface,
                     private readonly controllerMethodParameterDecoratorResolver: ControllerMethodParameterDecoratorResolver,
                     @inject("AuthorizerManagerInterface") private readonly authorizerManager: AuthorizerManagerInterface,
                     @inject("AuthenticationManagerInterface") private readonly authenticationManager: AuthenticationManagerInterface,
                     private readonly cache: RouterCache) {
  }

  /**
   * This method returns the whole route tree as a string.
   */
  getRouteTree(): string {
    let message = ""
    message = this.getRouteTreeLevel(this.root, message, 1);
    return message;
  }

  /**
   * This method registers a Route into the Route Tree maintained by the router.
   *
   * @param path
   * @param method
   * @param route
   */
  public register(path: string, method: HttpMethod | string, route: Route) {
    const splitPaths = UrlUtil.splitPath(path);

    this.root.add(splitPaths, method, route, 0);
  }

  //  */
  public setup() {
    if (this.setupCompleted) {
      return;
    }

    // Loop over all the controllers and control the Route Tree
    controllerRegistry.forEach(controller => {
      let basePath: string = ClassMetadata.getMetadata(controller, MetadataEnum.ControllerBasePath) ?? "";

      // Clean the base path by removing trailing slashes.
      if (basePath.endsWith("/")) {
        basePath = basePath.slice(0, basePath.length - 1);
      }

      const routePropertyKeys: string[] = ClassMetadata.getMetadata(controller, MetadataEnum.ControllerRoutes);

      routePropertyKeys.forEach(methodPropertyKey => {
        if (MethodMetadata.hasMetadata(controller.prototype, methodPropertyKey, MetadataEnum.Route) === false) {
          return;
        }

        // Retrieve the "RouteMethodDecorator" object assigned by the @route decorator at .route
        const routeMethodDecorator: RouteMethodDecorator = MethodMetadata.getMetadata(controller.prototype, methodPropertyKey, MetadataEnum.Route);

        // Build the Route object that will be used by the router to dispatch a request to
        // the appropriate controller method
        const route = new Route(controller.prototype.constructor, routeMethodDecorator.methodKeyname);
        route.methodArguments = MetadataUtil.getMethodParametersMetadata(controller.prototype, methodPropertyKey);
        const context = mergeWith({}, MetadataUtil.getRouteContext(controller.prototype.constructor), MetadataUtil.getRouteContext(controller.prototype, methodPropertyKey));
        route.context = context;

        // Build the proper path
        let path = routeMethodDecorator.path;

        // Clean the path by removing the first and trailing slashes.
        if (path.startsWith("/")) {
          path = path.slice(1, path.length);
        }

        if (path.endsWith("/")) {
          path = path.slice(0, path.length - 1);
        }

        // Build the proper path
        const routePath = basePath + "/" + path;

        // Register the route
        this.register(routePath, routeMethodDecorator.httpMethod, route);

      })

    })

    this.setupCompleted = true;
    this.loghandler.debug("Route tree: \n" + this.getRouteTree())
  }

  // /**
  //  * This method loops through the all the classes decorated with @controller, loops through all the methods decorated
  //  * with @route and builds the dependency tree of all the routes.
  //  *
  //  * @private

  /**
   * This method receives a Request object, identifies the "path" its trying to hit, navigates the internally
   * maintained Route Tree, identifies the method in the controller that represents this "path", and calls the
   * method with the specified parameters.
   *
   * @param request
   * @param container
   */
  public execute(request: Request, container: DependencyContainer): Promise<Response> {
    // todo: remove all the rejects and replace it with a response that contains an error.
    // This method cannot throw.


    const tracingManager: TracingManagerInterface = container.resolve("TracingManagerInterface");

    const routerRequestExecutionSpan = tracingManager.startSpan(SpanKeynameEnum.RouterRequestExecution, SpanKeynameEnum.RequestExecution);

    return new Promise<Response>(async (resolve, reject) => {
      // Start by decomposing the URL. Set second parameter to true since we want to parse the query strings
      // Node's URL default package absolutely needs a base (or a host) if none is provided in the URL. Pristine doesn't
      // care at all about the host. If one is provided in the url, the base provided will do nothing.
      // If none is provided, then the default base will be used and all is well.
      const url = UrlUtil.getUrlFromRequestWithDefaultHost(request);

      // Split the path name
      const splitPath = UrlUtil.splitPath(url.pathname);

      // We cache the method node
      const cacheKeyname = request.httpMethod + "_" + url.pathname;

      let cachedRouterRoute: CachedRouterRoute | undefined = this.cache.get(cacheKeyname);

      let methodNode: MethodRouterNode | undefined = cachedRouterRoute?.methodNode;

      if (methodNode === undefined) {
        const methodNodeSpan = tracingManager.startSpan(SpanKeynameEnum.RouterFindMethodRouterNode, SpanKeynameEnum.RouterRequestExecution);
        // Retrieve the node to have information about the controller
        methodNode = this.root.find(splitPath, request.httpMethod) as MethodRouterNode;
        methodNodeSpan.end();

        // Cache the method node.
        cachedRouterRoute = this.cache.set(cacheKeyname, methodNode);
      }

      this.loghandler.debug("Router - Execute request", {
        rootNode: this.root,
        request,
        url,
        methodNode,
      });

      // If node doesn't exist, throw a 404 error
      if (methodNode === null) {
        this.loghandler.error("Cannot find the path", {
          highlights: {
            url,
          },
          extra: {
            rootNode: this.root,
            request,
          },
          eventId: request.id,
        });

        routerRequestExecutionSpan.end();
        return resolve(this.executeErrorResponseInterceptors(new NotFoundHttpError("No route found for method: '" + request.httpMethod + "' and path: '" + url.pathname + "'."), request, container));
      }

      // Get the route parameters
      const routeParameters = cachedRouterRoute?.routeParameters ?? (methodNode.parent as PathRouterNode).getRouteParameters(splitPath.reverse());

      if (cachedRouterRoute !== undefined && cachedRouterRoute.routeParameters === undefined) {
        cachedRouterRoute.routeParameters = routeParameters;
      }

      // Instantiate the controller
      const routerControllerResolverSpan = tracingManager.startSpan(SpanKeynameEnum.RouterControllerResolver, SpanKeynameEnum.RouterRequestExecution);
      this.loghandler.debug("Router - Will resolve the controller from the container", {
        routeParameters
      });
      const controller: any = container.resolve(methodNode.route.controllerInstantiationToken);
      this.loghandler.debug("Router - Controller resolved from the container", {
        routeParameters
      });
      routerControllerResolverSpan.end();

      this.loghandler.debug("Router - Before calling the authenticationManager", {
        controller,
        routeParameters
      });

      let identity: IdentityInterface | undefined;

      // Authenticate the request
      try {
        const routerRequestAuthenticationSpan = tracingManager.startSpan(SpanKeynameEnum.RouterRequestAuthentication, SpanKeynameEnum.RouterRequestExecution);
        identity = await this.authenticationManager.authenticate(request, methodNode.route.context, container);
        routerRequestAuthenticationSpan.end();

        this.loghandler.debug("Router - Found identity.", {
          highlights: {
            identityId: identity?.id ?? "None",
          }, extra: {
            identity,
          },
          eventId: request.id,
        });
      } catch (error: any) {
        this.loghandler.error("Authentication error", {
          highlights: {
            errorMessage: error.message ?? "Unknown error"
          },
          extra: {
            error,
            request,
            context: methodNode.route.context,
            container
          },
          eventId: request.id,
        });

        // Todo: check if the error is an UnauthorizedHttpError, else create one.
        if (error instanceof ForbiddenHttpError === false) {
          error = new ForbiddenHttpError("You are not allowed to access this.");
        }

        routerRequestExecutionSpan.end();
        return resolve(this.executeErrorResponseInterceptors(error as Error, request, container, methodNode));
      }

      // Call the controller with the resolved Method arguments
      try {
        // Verify that the identity making the request is authorized to make such a request
        if (await this.authorizerManager.isAuthorized(request, methodNode.route.context, container, identity) === false) {
          this.loghandler.error("User not authorized to access this url.", {
            request,
            context: methodNode.route.context,
            container,
            identity
          });

          routerRequestExecutionSpan.end();
          return resolve(this.executeErrorResponseInterceptors(new ForbiddenHttpError("You are not allowed to access this."), request, container, methodNode));
        }

        // Execute all the interceptors
        const requestInterceptorsSpan = tracingManager.startSpan(SpanKeynameEnum.RequestInterceptors, SpanKeynameEnum.RouterRequestExecution);
        const interceptedRequest = await this.executeRequestInterceptors(request, container, methodNode);
        requestInterceptorsSpan.end();

        this.loghandler.debug("Intercepted Request", {
          extra: {
            request,
            interceptedRequest,
          },
          eventId: request.id,
        })

        // Resolve the value to inject in the method arguments that have a decorator resolver
        let resolvedMethodArguments: any[] | undefined = this.cache.getCachedControllerMethodArguments(cacheKeyname, interceptedRequest);

        // If the cache did not contain the cached controller method arguments
        if (resolvedMethodArguments === undefined) {
          this.loghandler.debug("Resolved method arguments were not cached, currently resolving", {
            extra: {
              request,
              interceptedRequest,
            },
            eventId: request.id,
          });
          resolvedMethodArguments = [];

          for (const methodArgument of methodNode.route.methodArguments) {
            resolvedMethodArguments.push(await this.controllerMethodParameterDecoratorResolver.resolve(methodArgument, interceptedRequest, routeParameters, identity));
          }

          this.cache.setControllerMethodArguments(cacheKeyname, interceptedRequest, resolvedMethodArguments);

          this.loghandler.debug("Resolved method arguments cached for next call.", {
            request,
            interceptedRequest,
            resolvedMethodArguments,
          });
        } else {
          this.loghandler.debug("Method arguments were successfully cached and will be used.", {
            request,
            interceptedRequest,
            resolvedMethodArguments,
          });
        }

        const controllerResponse = controller[methodNode.route.methodPropertyKey](...resolvedMethodArguments);

        // This resolves the promise if it's a promise or promisifies the value
        // https://stackoverflow.com/a/27760489/684101
        const response = await Promise.resolve(controllerResponse);

        this.loghandler.debug("Router - The response returned by the controller", {
          extra: {response},
          eventId: request.id,
        })

        let returnedResponse: Response;
        // If the response is already a Response object, return the response
        if (response instanceof Response) {
          this.loghandler.debug("Router - Response returned by the controller is a Response object", {
            extra: {response},
            eventId: request.id,
          })
          returnedResponse = response;
        } else {
          // If the response is not a response object, but the method hasn't thrown an error, assume the
          // returned response is directly the body. Also assume an Http Status code of 200.
          returnedResponse = new Response();
          returnedResponse.status = 200;
          returnedResponse.body = response;

          this.loghandler.debug("Router - Response returned by the controller is NOT a Response object", {
            extra: {
              response,
              returnedResponse,
            },
            eventId: request.id,
          })
        }

        this.loghandler.debug("Router - The response before calling the response interceptors ", {
          extra: {
            response,
            returnedResponse,
          },
          eventId: request.id,
        })

        const responseInterceptorsSpan = tracingManager.startSpan(SpanKeynameEnum.ResponseInterceptors, SpanKeynameEnum.RouterRequestExecution);
        const interceptedResponse = await this.executeResponseInterceptors(returnedResponse, request, container, methodNode);
        responseInterceptorsSpan.end();

        routerRequestExecutionSpan.end();
        return resolve(interceptedResponse);
      } catch (error: any) {
        this.loghandler.error("Router - There was an error trying to execute the request in the router", {
          highlights: {
            errorMessage: error.message ?? "Unknown error",
          },
          extra: {
            error,
          },
          eventId: request.id,
        })

        // Execute router interceptors for the error response;

        routerRequestExecutionSpan.end();

        return resolve(this.executeErrorResponseInterceptors(error as Error, request, container, methodNode));
      }
    })
  }

  /**
   * This method takes the existing message and appends the following levels to it.
   * It calls itself recursively.
   * @param node The node to print the following levels.
   * @param message The existing message on which to append.
   * @param level The level at which we are at.
   */
  private getRouteTreeLevel(node: RouterNode, message: string, level: number): string {
    for (const child of node.children) {
      for (let i = 0; i < level; i++) {
        message += "\t";
      }
      if (child instanceof PathRouterNode) {
        message += "--" + child.path + "\n";
      }
      if (child instanceof MethodRouterNode) {
        message += "--" + child.method + "\n";
      }
      message = this.getRouteTreeLevel(child, message, level + 1);
    }
    return message;
  }

  /**
   * This method executes all the Request Interceptors and returns the request updated by the interceptors.
   *
   * @param request
   * @param container
   * @param methodNode
   * @private
   */
  private async executeRequestInterceptors(request: Request, container: DependencyContainer, methodNode: MethodRouterNode): Promise<Request> {
    this.loghandler.debug("Router - Request Interceptors - Start", {
      extra: {
        request,
        methodNode,
      },
      eventId: request.id,
    })

    // Execute all the request interceptors
    let interceptedRequest = request;

    // Check first if there are any Request Interceptors
    if (container.isRegistered(ServiceDefinitionTagEnum.RequestInterceptor, true)) {
      const interceptors: any[] = (container.resolveAll(ServiceDefinitionTagEnum.RequestInterceptor) as RequestInterceptorInterface[]).sort((a: RequestInterceptorInterface, b: RequestInterceptorInterface) => {
        const aPriority = a.priority ?? RequestInterceptorPriorityEnum.Default;
        const bPriority = b.priority ?? RequestInterceptorPriorityEnum.Default;

        return bPriority - aPriority;
      });

      for (const interceptor of interceptors) {
        // We don't have a guarantee that the Router Interceptors will implement the Interface, even though we specify it should.
        // So, we have to verify that the method exists, and if it doesn't we throw
        if (typeof interceptor.interceptRequest === "undefined") {
          // Simply log a message for now that the interceptors doesn't implement the 'interceptRequest' method.
          this.loghandler.debug("The Request Interceptor doesn't implement the interceptRequest method.", {
            highlights: {
              name: interceptor.constructor.name,
            },
            extra: {
              interceptor
            },
            eventId: request.id,

          });
          continue;
        }

        try {
          // https://stackoverflow.com/a/27760489/684101
          interceptedRequest = await (interceptor as RequestInterceptorInterface).interceptRequest?.(interceptedRequest, methodNode) ?? interceptedRequest;
        } catch (error: any) {
          this.loghandler.error("There was an exception thrown while executing the 'interceptedRequest' method of the RequestInterceptor named: '" + interceptor.constructor.name + "'.", {
            highlights: {
              errorMessage: error.message ?? "Unknown error",
              interceptorName: interceptor.constructor.name,
            },
            extra: {
              error,
              interceptor,
            },
            eventId: request.id,
          });
          throw error;
        }
      }
    }

    this.loghandler.debug("Router - Request Interceptors - End", {
      extra: {
        request,
        interceptedRequest,
        methodNode,
      },
      eventId: request.id,
    })

    return interceptedRequest;
  }


  /**
   * This method executes all the Request Interceptors and returns the response updated by the interceptors.
   *
   * @param response
   * @param request
   * @param container
   * @param methodNode
   * @private
   */
  private async executeResponseInterceptors(response: Response, request: Request, container: DependencyContainer, methodNode?: MethodRouterNode): Promise<Response> {
    this.loghandler.debug("Router - Response Interceptors - Start", {
      extra: {
        response,
        request,
        methodNode,
      },
      eventId: request.id,
    })

    // Execute all the request interceptors
    let interceptedResponse = response;

    // Check first if there are any Request interceptors
    if (container.isRegistered(ServiceDefinitionTagEnum.RequestInterceptor, true)) {
      const interceptors: any[] = (container.resolveAll(ServiceDefinitionTagEnum.RequestInterceptor) as RequestInterceptorInterface[]).sort((a: RequestInterceptorInterface, b: RequestInterceptorInterface) => {
        const aPriority = a.priority ?? RequestInterceptorPriorityEnum.Default;
        const bPriority = b.priority ?? RequestInterceptorPriorityEnum.Default;

        return bPriority - aPriority;
      });

      for (const interceptor of interceptors) {
        // We don't have a guarantee that the Router response interceptors will implement the Interface, even though we specify it should.
        // So, we have to verify that the method exists, and if it doesn't we throw
        if (typeof interceptor.interceptResponse === "undefined") {
          // Simply log a message for now that the interceptors doesn't implement the 'interceptResponse' method.
          this.loghandler.debug("Router - The Request Interceptor doesn't implement the interceptResponse method.", {
            highlights: {
              name: interceptor.constructor.name,
            },
            extra: {
              interceptor
            },
            eventId: request.id,
          });
          continue;
        }

        try {
          interceptedResponse = await (interceptor as RequestInterceptorInterface).interceptResponse?.(interceptedResponse, request, methodNode) ?? interceptedResponse;
        } catch (error: any) {
          this.loghandler.error("Router - There was an exception thrown while executing the 'interceptResponse' method of the RequestInterceptor named: '" + interceptor.constructor.name + "'.", {
            highlights: {
              name: interceptor.constructor.name,
            },
            extra: {
              error,
              interceptor,
            },
            eventId: request.id,
          });
          throw error;
        }
      }
    }

    this.loghandler.debug("Router - Response Interceptors - End", {
      extra: {
        response,
        interceptedResponse,
        request,
        methodNode,
      },
      eventId: request.id,
    })

    return interceptedResponse;
  }


  /**
   * This method executes all the Request Interceptors and returns the response updated by the error interceptors.
   *
   * @param error
   * @param request
   * @param container
   * @param methodNode
   * @private
   */
  private async executeErrorResponseInterceptors(error: Error, request: Request, container: DependencyContainer, methodNode?: MethodRouterNode): Promise<Response> {
    this.loghandler.debug("Router - Error Response Interceptors - Start", {
      error,
      request,
      methodNode,
    })

    // Execute all the request interceptors
    let interceptedResponse = new Response();
    if (error instanceof HttpError) {
      interceptedResponse.status = error.httpStatus;
      interceptedResponse.body = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        errors: error.errors,
        extra: error.extra,
      }
    } else {
      interceptedResponse.status = 500;
      interceptedResponse.body = {name: error.name, message: error.message, stack: error.stack};
    }

    interceptedResponse.request = request;

    // Check first if there are any Request interceptors
    if (container.isRegistered(ServiceDefinitionTagEnum.RequestInterceptor, true)) {
      const interceptors: any[] = (container.resolveAll(ServiceDefinitionTagEnum.RequestInterceptor) as RequestInterceptorInterface[]).sort((a: RequestInterceptorInterface, b: RequestInterceptorInterface) => {
        const aPriority = a.priority ?? RequestInterceptorPriorityEnum.Default;
        const bPriority = b.priority ?? RequestInterceptorPriorityEnum.Default;

        return bPriority - aPriority;
      });

      for (const interceptor of interceptors) {
        // We don't have a guarantee that the Router response interceptors will implement the Interface, even though we specify it should.
        // So, we have to verify that the method exists, and if it doesn't we throw
        if (typeof interceptor.interceptError === "undefined") {
          // Simply log a message for now that the interceptors doesn't implement the 'interceptError' method.
          this.loghandler.debug("The Request Interceptor doesn't implement the interceptError method.", {
            highlights: {
              interceptorName: interceptor.constructor.name,
            },
            extra: {
              interceptor
            },
            eventId: request.id,
          });
          continue;
        }

        try {
          interceptedResponse = await (interceptor as RequestInterceptorInterface).interceptError?.(error, interceptedResponse, request, methodNode) ?? interceptedResponse;
        } catch (error: any) {
          this.loghandler.error("There was an exception thrown while executing the 'interceptError' method of the RequestInterceptor named: '" + interceptor.constructor.name + "'.", {
            highlights: {
              errorMessage: error.message ?? "",
              interceptorName: interceptor.constructor.name,
            },
            extra: {error},
            eventId: request.id,
          });
          throw error;
        }
      }
    }

    interceptedResponse = await this.executeResponseInterceptors(interceptedResponse, request, container, methodNode);

    this.loghandler.debug("Router - Error Response Interceptors - End", {
      extra: {
        error,
        interceptedResponse,
        request,
        methodNode,
      },
      eventId: request.id,
    })

    return interceptedResponse;
  }
}
