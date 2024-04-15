import {FileManager} from "./file.manager";

describe("File Manager", () => {
    it("should properly find the elements in the text", async () => {
        const fileManager = new FileManager();

        const cursors = await fileManager.findInFile("ipsum", "test-files/lorem_ipsum.txt");

        expect(cursors.length).toBe(4);
        expect(cursors[0].line).toBe(0);
        expect(cursors[0].position).toBe(6);

        expect(cursors[1].line).toBe(4);
        expect(cursors[1].position).toBe(298);

        expect(cursors[2].line).toBe(8);
        expect(cursors[2].position).toBe(235);

        expect(cursors[3].line).toBe(10);
        expect(cursors[3].position).toBe(51);
    })
    it("should properly find the elements in the text when a regex is passed", async () => {
        const fileManager = new FileManager();

        const cursors = await fileManager.findInFile(/(eleifend)|(pulvinar)/gi, "test-files/lorem_ipsum.txt");

        expect(cursors.length).toBe(9);

        // eleifend
        expect(cursors[0].line).toBe(2);
        expect(cursors[0].position).toBe(416);

        // pulvinar
        expect(cursors[1].line).toBe(2);
        expect(cursors[1].position).toBe(457);

        // pulvinar
        expect(cursors[2].line).toBe(6);
        expect(cursors[2].position).toBe(24);

        // eleifend
        expect(cursors[3].line).toBe(6);
        expect(cursors[3].position).toBe(33);

        // pulvinar
        expect(cursors[4].line).toBe(8);
        expect(cursors[4].position).toBe(213);

        // eleifend
        expect(cursors[5].line).toBe(8);
        expect(cursors[5].position).toBe(595);

        // pulvinar
        expect(cursors[6].line).toBe(10);
        expect(cursors[6].position).toBe(332);

        // pulvinar
        expect(cursors[7].line).toBe(12);
        expect(cursors[7].position).toBe(76);

        // pulvinar
        expect(cursors[8].line).toBe(14);
        expect(cursors[8].position).toBe(414);
    })
})
