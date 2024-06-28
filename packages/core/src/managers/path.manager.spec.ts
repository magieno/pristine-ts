import "reflect-metadata"
import {PathManager} from "./path.manager";
import {PathAlreadyContainsFilenameError} from "../errors/path-already-contains-filename.error";

describe("Path Manager", () => {
    it("should properly append a path that begins with a '/'.", () => {
        const pathManager = new PathManager();

        const path = pathManager.getPathRelativeToCurrentExecutionDirectory("/allo");

        const pathParts = path.split("/").reverse();

        expect(pathParts[0]).toBe("allo")
        expect(pathParts[1]).toBe("core")
        expect(pathParts[2]).toBe("packages")
    })

    it("should properly append a path that ends with a '/'.", () => {
        const pathManager = new PathManager();

        const path = pathManager.getPathRelativeToCurrentExecutionDirectory("/allo/");

        const pathParts = path.split("/").reverse();

        expect(pathParts[0]).toBe("allo")
        expect(pathParts[1]).toBe("core")
        expect(pathParts[2]).toBe("packages")
    })

    it("should throw an error when passing two filenames", () => {
        const pathManager = new PathManager();

        expect(() => pathManager.getPathRelativeToCurrentExecutionDirectory("/allo/test.txt", "data.bin")).toThrow(PathAlreadyContainsFilenameError);
    })

    it("should properly append a path and filename", () => {
        const pathManager = new PathManager();

        const path = pathManager.getPathRelativeToCurrentExecutionDirectory("/allo/", "test.txt");

        const pathParts = path.split("/").reverse();

        expect(pathParts[0]).toBe("test.txt")
        expect(pathParts[1]).toBe("allo")
        expect(pathParts[2]).toBe("core")
        expect(pathParts[3]).toBe("packages")
    })
})