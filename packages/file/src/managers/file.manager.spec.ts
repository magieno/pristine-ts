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
})