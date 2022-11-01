import {MethodRouterNode} from "../nodes/method-router.node";
import {Request, RequestUtil} from "@pristine-ts/common";

export class CachedRouterRoute {
    private cachedControllerMethodArguments: { [requestHash: string]: any[] } = {};
    public routeParameters?: { [key: string]: string };

    constructor(public readonly methodNode: MethodRouterNode,
    ) {
    }

    private hashRequest(request: Request): string | null {
        return RequestUtil.hash(request);
    }

    getCachedControllerMethodArguments(request: Request): any[] | undefined {
        // Hashed the request
        const hash = this.hashRequest(request);

        if(hash === null) {
            return;
        }

        // Return the arguments if the hashed request exists
        return this.cachedControllerMethodArguments[hash];
    }

    cacheControllerMethodArguments(request: Request, methodArguments: any[]): void {
        // Hashed the request
        const hash = this.hashRequest(request);

        if(hash === null) {
            return;
        }

        // Save the method arguments
        this.cachedControllerMethodArguments[hash] = methodArguments;
    }
}