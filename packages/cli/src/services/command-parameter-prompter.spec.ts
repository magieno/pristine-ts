import "reflect-metadata";
import {UsageError} from "@pristine-ts/common";
import {IsOptional, IsString} from "@pristine-ts/class-validator";
import {CommandParameterPrompter} from "./command-parameter-prompter";
import {commandParameter} from "../decorators/command-parameter.decorator";
import {CliErrorCode} from "../errors/cli-error-code.enum";

/**
 * Stand-in for `CliPrompt` that records the questions it was asked and replays a queue of
 * scripted answers, so prompting can be asserted without a real terminal.
 */
class FakeCliPrompt {
  public readonly questions: string[] = [];

  constructor(private readonly answers: string[] = []) {
  }

  async readLine(question: string): Promise<string> {
    this.questions.push(question);
    return this.answers.shift() ?? "";
  }
}

class PlainOptions {
  @IsOptional()
  @IsString()
  port?: string;
}

class AliasOnlyOptions {
  @commandParameter({flag: "db-url"})
  @IsOptional()
  @IsString()
  databaseUrl?: string;
}

class QuestionOptions {
  @commandParameter({flag: "db-url", question: "Database URL?"})
  @IsString()
  databaseUrl?: string;
}

class NoFlagQuestionOptions {
  @commandParameter({question: "Your name?"})
  @IsString()
  name?: string;
}

class ConflictOptions {
  @commandParameter({flag: "shared"})
  @IsOptional()
  @IsString()
  alpha?: string;

  @commandParameter({flag: "shared"})
  @IsOptional()
  @IsString()
  beta?: string;
}

const build = (answers: string[] = [], enabled = true): {prompter: CommandParameterPrompter; prompt: FakeCliPrompt} => {
  const prompt = new FakeCliPrompt(answers);
  const prompter = new CommandParameterPrompter(prompt as any, enabled);
  return {prompter, prompt};
};

describe("CommandParameterPrompter", () => {
  let originalIsTty: boolean | undefined;

  beforeEach(() => {
    originalIsTty = process.stdin.isTTY;
  });

  afterEach(() => {
    Object.defineProperty(process.stdin, "isTTY", {value: originalIsTty, configurable: true});
  });

  const setTty = (value: boolean) => {
    Object.defineProperty(process.stdin, "isTTY", {value, configurable: true});
  };

  it("returns a copy and leaves arguments without @commandParameter untouched", async () => {
    setTty(true);
    const {prompter} = build();
    const raw = {port: "3000"};

    const result = await prompter.fillMissingParameters(PlainOptions, raw);

    expect(result).toEqual({port: "3000"});
    expect(result).not.toBe(raw);
  });

  it("binds an aliased flag onto its property without mutating the input", async () => {
    setTty(true);
    const {prompter, prompt} = build();
    const raw = {"db-url": "mysql://provided"};

    const result = await prompter.fillMissingParameters(AliasOnlyOptions, raw);

    expect(result.databaseUrl).toBe("mysql://provided");
    expect(prompt.questions).toEqual([]);
    expect((raw as any).databaseUrl).toBeUndefined();
  });

  it("asks the question when the flag is missing and fills the answer", async () => {
    setTty(true);
    const {prompter, prompt} = build(["mysql://answer"]);

    const result = await prompter.fillMissingParameters(QuestionOptions, {});

    expect(prompt.questions).toEqual(["Database URL? "]);
    expect(result.databaseUrl).toBe("mysql://answer");
  });

  it("asks for a question parameter that has no flag override", async () => {
    setTty(true);
    const {prompter, prompt} = build(["Etienne"]);

    const result = await prompter.fillMissingParameters(NoFlagQuestionOptions, {});

    expect(prompt.questions).toEqual(["Your name? "]);
    expect(result.name).toBe("Etienne");
  });

  it("does not ask when the aliased flag was already provided", async () => {
    setTty(true);
    const {prompter, prompt} = build(["unused"]);

    const result = await prompter.fillMissingParameters(QuestionOptions, {"db-url": "mysql://provided"});

    expect(prompt.questions).toEqual([]);
    expect(result.databaseUrl).toBe("mysql://provided");
  });

  it("does not ask when interactive parameters are disabled", async () => {
    setTty(true);
    const {prompter, prompt} = build(["mysql://answer"], false);

    const result = await prompter.fillMissingParameters(QuestionOptions, {});

    expect(prompt.questions).toEqual([]);
    expect(result.databaseUrl).toBeUndefined();
  });

  it("does not ask when stdin is not an interactive terminal", async () => {
    setTty(false);
    const {prompter, prompt} = build(["mysql://answer"]);

    const result = await prompter.fillMissingParameters(QuestionOptions, {});

    expect(prompt.questions).toEqual([]);
    expect(result.databaseUrl).toBeUndefined();
  });

  it("leaves the value unset when the answer is empty", async () => {
    setTty(true);
    const {prompter, prompt} = build(["   "]);

    const result = await prompter.fillMissingParameters(QuestionOptions, {});

    expect(prompt.questions).toHaveLength(1);
    expect(result.databaseUrl).toBeUndefined();
  });

  it("throws a flag-conflict UsageError when two parameters bind to the same flag", async () => {
    const {prompter} = build();
    const promise = prompter.fillMissingParameters(ConflictOptions, {});

    await expect(promise).rejects.toBeInstanceOf(UsageError);
    await expect(promise).rejects.toMatchObject({
      options: expect.objectContaining({
        code: CliErrorCode.CommandParameterFlagConflict,
        details: expect.objectContaining({
          flag: "shared",
          properties: ["alpha", "beta"],
        }),
      }),
    });
  });
});
