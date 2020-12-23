export class UrlUtil {
    public static splitPath(path: string): string[] {
        let buffer = "";

        let paths: string[] = [];

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