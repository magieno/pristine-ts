/**
 * This class provides a bunch of utilities to deal with Urls.
 */
export class UrlUtil {
    /**
     * This method receives a path parameter (e.g. /api/2.0/dogs/id/puppies) and returns an array where each url segment is split:
     * - /api
     * - /2.0
     * - /dogs
     * - /id
     * - /puppies
     *
     * @param path
     */
    public static splitPath(path: string): string[] {
        let buffer = "";

        let paths: string[] = [];

        // Loop over the entire path string and push the characters in a buffer string until you hit a "/". When you do,
        // push the buffer string into a new array element and continue until the end of the string.
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

    /**
     *
     * @param path Must start with a '/'.
     */
    public static isPathARouteParameter(path: string) {
        // If the current path is a path parameter, meaning has services/{id-of-service}
        if (path.startsWith("/{") && path.endsWith("}")) {
            return true;
        }

        // We also support path parameter written as services/:id-of-service
        if (path.startsWith("/:")) {
            return true;
        }

        return false;
    }

    /**
     *
     * @param path Must start with a '/'.
     */
    public static isPathACatchAll(path: string) {
        return path.startsWith("/*");
    }
}