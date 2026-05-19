import "reflect-metadata";
import {CliPrompt} from "./cli-prompt.manager";

describe("CliPrompt", () => {
  let prompt: CliPrompt;

  beforeEach(() => {
    prompt = new CliPrompt();
  });

  it("read delegates to process.stdin.read", () => {
    const spy = jest.spyOn(process.stdin, "read").mockReturnValue("buffered" as any);
    expect(prompt.read()).toBe("buffered");
    spy.mockRestore();
  });
});
