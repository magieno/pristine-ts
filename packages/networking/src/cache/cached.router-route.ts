import {MethodRouterNode} from "../nodes/method-router.node";
import {Request} from "@pristine-ts/common";
import {createHash} from "crypto";
import {URL} from "url";

export class CachedRouterRoute {
    private cachedControllerMethodArguments: { [requestHash: string]: any[] } = {};
    public routeParameters?: { [key: string]: string };

    constructor(public readonly methodNode: MethodRouterNode,
    ) {
    }

    public static hashRequest(request: Request): string | null {
        const sort = (obj: any) => {
            const ret: any = {};

            Object.keys(obj).sort().forEach(function (key) {
                ret[key] = obj[key];
            });

            return ret;
        };

        const hash = createHash("md5");

        const parsedUrl = new URL(request.url);

        parsedUrl.searchParams.sort();

        hash.update(parsedUrl.pathname);
        hash.update(request.httpMethod);
        hash.update(parsedUrl.searchParams.toString());
        hash.update(parsedUrl.hash);
        hash.update(JSON.stringify(sort(request.headers)));

        try {
            hash.write(JSON.stringify(request.body));
        } catch (e) {
            return null;
        }


        return hash.digest("hex");
    }

    getCachedControllerMethodArguments(request: Request): any[] | undefined {
        // Hashed the request
        const hash = CachedRouterRoute.hashRequest(request);

        if(hash === null) {
            return;
        }

        // Return the arguments if the hashed request exists
        return this.cachedControllerMethodArguments[hash];
    }

    cacheControllerMethodArguments(request: Request, methodArguments: any[]): void {
        // Hashed the request
        const hash = CachedRouterRoute.hashRequest(request);

        if(hash === null) {
            return;
        }

        // Save the method arguments
        this.cachedControllerMethodArguments[hash] = methodArguments;
    }
}
