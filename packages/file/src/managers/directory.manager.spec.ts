        import {DirectoryManager} from "./directory.manager";
import {MatchTypeEnum} from "../enums/match-type.enum";
import {TypesEnum} from "../enums/types.enum";

describe("Directory Manager", () => {
    it("should properly return only the .json files in the test-files folder", async () => {
        const directoryManager = new DirectoryManager();

        const files = await directoryManager.list("test-files", {matchType: MatchTypeEnum.Extension, match: "json", recurse: true});

        expect(files.length).toBe(6);
    })

    it("should properly return the matching folders", async() => {
        const directoryManager = new DirectoryManager();

        const files = await directoryManager.list("test-files", {matchType: MatchTypeEnum.Filename, types: TypesEnum.Directory, match: "1a", recurse: true});

        expect(files.length).toBe(1);
    })

    it("should properly return the matching files", async() => {
        const directoryManager = new DirectoryManager();

        const files = await directoryManager.list("test-files", {matchType: MatchTypeEnum.Base, types: TypesEnum.File, match: "test", recurse: true});

        expect(files.length).toBe(3);
    })

    it("should properly return the matching files using a regex", async() => {
        const directoryManager = new DirectoryManager();

        const files = await directoryManager.list("test-files", {matchType: MatchTypeEnum.Filename, types: TypesEnum.File, match: /test.*/, recurse: true});

        expect(files.length).toBe(5);
    })
})