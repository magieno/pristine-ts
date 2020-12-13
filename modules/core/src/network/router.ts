import {singleton} from "tsyringe";
import {Route} from "./route";
import {RouterNode} from "./router.node";
import {PathRouterNode} from "./path-router.node";
import {HttpMethod} from "../enums/http-method.enum";

@singleton()
export class Router {
    private root: RouterNode = new PathRouterNode("/", null);;

    public constructor() {
    }

    // todo, rename that parameter
    public register(path: string, method: HttpMethod, objectToNameThatWillAllowUsToEasilyCallTheControllerMethodWithProperArguments: any) {
        const splitPaths = this.splitPath(path);

        this.root.add(splitPaths, method);
    }

    private splitPath(path: string): string[] {
        let buffer = "";

        let paths = [];

        for (let i = 0; i < path.length; i++) {
            if(path[i] === "/") {
                paths.push("/" + buffer);
                buffer = "";
            }
            else {
                buffer += path[i]
            }
        }

        // Don't forget at the end to add the remaining buffer as the last path
        if(buffer !== "") {
            paths.push("/" + buffer);
        }

        // We never want a trailing slash as an individual element so we have to remove it
        if(paths[paths.length - 1] === "/") {
            paths = paths.slice(0, paths.length - 1);
        }

        return paths;
    }

}