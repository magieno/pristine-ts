import {DirectoryManager} from "./directory.manager";
import {MatchTypeEnum} from "../enums/match-type.enum";
import {TypesEnum} from "../enums/types.enum";
import {FileManager} from "./file.manager";
import {DirectoryListResultEnum} from "../enums/directory-list-result.enum";
import fs, {promises as fsp} from "fs";

describe("Directory Manager", () => {
    it("should properly return only the .json files in the test-files folder", async () => {
        const directoryManager = new DirectoryManager(new FileManager());

        const files = await directoryManager.list("test-files", {
            matchType: MatchTypeEnum.Extension,
            match: "json",
            recurse: true
        });

        expect(files.length).toBe(6);
    })

    it("should properly return the matching folders", async () => {
        const directoryManager = new DirectoryManager(new FileManager());

        const files = await directoryManager.list("test-files", {
            matchType: MatchTypeEnum.Filename,
            types: TypesEnum.Directory,
            match: "1a",
            recurse: true
        });

        expect(files.length).toBe(1);
    })

    it("should properly return the matching files", async () => {
        const directoryManager = new DirectoryManager(new FileManager());

        const files = await directoryManager.list("test-files", {
            matchType: MatchTypeEnum.Base,
            types: TypesEnum.File,
            match: "test",
            recurse: true
        });

        expect(files.length).toBe(4);
    })

    it("should properly return the matching files using a regex", async () => {
        const directoryManager = new DirectoryManager(new FileManager());

        const files = await directoryManager.list("test-files", {
            matchType: MatchTypeEnum.Filename,
            types: TypesEnum.File,
            match: /test.*/,
            recurse: true
        });

        expect(files.length).toBe(6);
    })

    it("should properly copy one directory to another", async () => {
        // Copy all the json files inside the "1" directory to the "2" directory
        const directoryManager = new DirectoryManager(new FileManager());
        await directoryManager.copy("test-files/1", "test-files/2", {
            matchType: MatchTypeEnum.Extension,
            match: "json",
            recurse: true
        });

        // Check that the 2 directory exists
        const exists = await directoryManager.exists("test-files/2");
        expect(exists).toBe(true);

        // Check that the files are copied
        const files = await directoryManager.list("test-files/2", {
            matchType: MatchTypeEnum.Extension,
            recurse: true,
            resultType: DirectoryListResultEnum.FileInfoObject
        });
        expect(files.length).toBe(3);

        // Remove the 2 directory using node fs built in functions.
        await fsp.rm("test-files/2", {recursive: true, force: true});
    })
})