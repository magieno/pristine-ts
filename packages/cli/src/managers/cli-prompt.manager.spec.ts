import "reflect-metadata";
import {CliPrompt} from "./cli-prompt.manager";
import {DynamicImporter} from "../bootstrap/dynamic-importer";

describe("CliPrompt", () => {
  it("read delegates to process.stdin.read", () => {
    const prompt = new CliPrompt(new DynamicImporter());
    const spy = jest.spyOn(process.stdin, "read").mockReturnValue("buffered" as any);
    expect(prompt.read()).toBe("buffered");
    spy.mockRestore();
  });

  it("readSecret masks input via @inquirer/prompts' password, lazy-loaded through the importer", async () => {
    const password = jest.fn().mockResolvedValue("hunter2");
    const importer = {import: jest.fn().mockResolvedValue({password})} as unknown as DynamicImporter;
    const prompt = new CliPrompt(importer);

    const answer = await prompt.readSecret("Database password? ");

    expect(importer.import).toHaveBeenCalledWith("@inquirer/prompts");
    expect(password).toHaveBeenCalledWith(expect.objectContaining({message: "Database password? "}));
    expect(answer).toBe("hunter2");
  });
});
