import {FileManager} from "./file.manager";
import {unlink} from "fs/promises";

``
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

  it("should properly replace the elements in the text", async () => {
    const fileManager = new FileManager();

    const replaceOperations = [
      {
        search: "ipsum",
        replace: "REPLACED_TEXT_1",
      },
      {
        search: /lorem/gi,
        replace: "REPLACED_TEXT_2",
      },
    ];

    await fileManager.replaceInFile("test-files/lorem_ipsum.txt", replaceOperations, {
      outputFilePath: "test-files/lorem_ipsum_replaced.txt",
    });

    const fileBuffer = await fileManager.readFile("test-files/lorem_ipsum_replaced.txt");
    const fileContent = fileBuffer.toString("utf-8");

    expect(fileContent).toContain("REPLACED_TEXT_1");
    // Count the number of times "ipsum" appears in the file
    const ipsumCount = (fileContent.match(/REPLACED_TEXT_1/g) || []).length;
    expect(ipsumCount).toBe(4);

    expect(fileContent).toContain("REPLACED_TEXT_2");
    // Count the number of times "lorem" appears in the file
    const loremCount = (fileContent.match(/REPLACED_TEXT_2/g) || []).length;
    expect(loremCount).toBe(6);

    // Delete the file after the test
    await unlink("test-files/lorem_ipsum_replaced.txt");
  })

  it("should properly replace the elements in the text with a function", async () => {
    const fileManager = new FileManager();

    const replaceOperations = [
      {
        search: "ipsum",
        replace: (substring: string) => {
          return substring.toUpperCase();
        },
      },
      {
        search: /lorem/gi,
        replace: (substring: string) => {
          return substring.toLowerCase();
        },
      },
    ];

    await fileManager.replaceInFile("test-files/lorem_ipsum.txt", replaceOperations, {
      outputFilePath: "test-files/lorem_ipsum_replaced.txt",
    });

    const fileBuffer = await fileManager.readFile("test-files/lorem_ipsum_replaced.txt");
    const fileContent = fileBuffer.toString("utf-8");

    expect(fileContent).toContain("IPSUM");
    // Count the number of times "ipsum" appears in the file
    const ipsumCount = (fileContent.match(/IPSUM/g) || []).length;
    expect(ipsumCount).toBe(4);

    expect(fileContent).toContain("lorem");
    // Count the number of times "lorem" appears in the file
    const loremCount = (fileContent.match(/lorem/g) || []).length;
    expect(loremCount).toBe(6);

    // Delete the file after the test
    await unlink("test-files/lorem_ipsum_replaced.txt");
  })

  it("should properly replace the elements in the text even when the search text is multiple lines", async () => {
    const fileManager = new FileManager();

    const replaceOperations = [
      {
        search: /\/\/ remove-if-prod(\n.*)*\/\/ end-remove-if-prod/gim,
        replace: "",
      },
    ];

    await fileManager.replaceInFile("test-files/test.js", replaceOperations, {
      outputFilePath: "test-files/test_prod.js",
    });

    const fileBuffer = await fileManager.readFile("test-files/test_prod.js");
    const fileContent = fileBuffer.toString("utf-8");

    expect(fileContent).not.toContain("const prod = \"prod\";");

    // Delete the file after the test
    await unlink("test-files/test_prod.js");
  })
})
