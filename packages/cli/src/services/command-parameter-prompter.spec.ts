import "reflect-metadata";
import {UsageError} from "@pristine-ts/common";
import {IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Validator} from "@pristine-ts/class-validator";
import {
  AutoDataMappingBuilder,
  BooleanNormalizer,
  DataMapper,
  DateNormalizer,
  NumberNormalizer,
  StringNormalizer,
} from "@pristine-ts/data-mapping";
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

/** Captures the feedback lines the prompter writes (re-ask messages, constraint errors). */
class CapturingCliOutput {
  public readonly lines: string[] = [];

  writeLine(line: string): void {
    this.lines.push(line);
  }
}

/** A `DataMapper` with the same normalizers `DataMappingModule` ships, so coercion is real. */
const buildDataMapper = (): DataMapper => new DataMapper(
  new AutoDataMappingBuilder(),
  [new StringNormalizer(), new NumberNormalizer(), new BooleanNormalizer(), new DateNormalizer()],
  [],
);

enum BuildFormat {
  Esm = "esm",
  Cjs = "cjs",
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

class BooleanOptions {
  @commandParameter({question: "Enable feature?"})
  @IsBoolean()
  enabled!: boolean;
}

class NumberOptions {
  @commandParameter({question: "Port?"})
  @IsNumber()
  port!: number;
}

class EnumOptions {
  @commandParameter({question: "Format?"})
  @IsEnum(BuildFormat)
  format!: BuildFormat;
}

class MaxLengthOptions {
  @commandParameter({question: "Short name?"})
  @IsString()
  @MaxLength(5)
  shortName!: string;
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

const build = (answers: string[] = [], enabled = true): {prompter: CommandParameterPrompter; prompt: FakeCliPrompt; output: CapturingCliOutput} => {
  const prompt = new FakeCliPrompt(answers);
  const output = new CapturingCliOutput();
  const prompter = new CommandParameterPrompter(prompt as any, output as any, new Validator(), buildDataMapper(), enabled);
  return {prompter, prompt, output};
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

  describe("flag binding & gating", () => {
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

  describe("prompting (string)", () => {
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

    it("leaves the value unset when the answer is empty", async () => {
      setTty(true);
      const {prompter, prompt} = build(["   "]);

      const result = await prompter.fillMissingParameters(QuestionOptions, {});

      expect(prompt.questions).toHaveLength(1);
      expect(result.databaseUrl).toBeUndefined();
    });
  });

  describe("prompting (typed)", () => {
    it("renders a boolean as (y/n) and maps yes to true", async () => {
      setTty(true);
      const {prompter, prompt} = build(["yes"]);

      const result = await prompter.fillMissingParameters(BooleanOptions, {});

      expect(prompt.questions[0]).toBe("Enable feature? (y/n) ");
      expect(result.enabled).toBe(true);
    });

    it("maps a no answer to false rather than silently dropping it", async () => {
      setTty(true);
      const {prompter} = build(["no"]);

      const result = await prompter.fillMissingParameters(BooleanOptions, {});

      expect(result.enabled).toBe(false);
    });

    it("re-asks when a boolean answer is not yes/no", async () => {
      setTty(true);
      const {prompter, prompt, output} = build(["maybe", "y"]);

      const result = await prompter.fillMissingParameters(BooleanOptions, {});

      expect(result.enabled).toBe(true);
      expect(prompt.questions).toHaveLength(2);
      expect(output.lines).toContain("Please answer yes (y) or no (n).");
    });

    it("coerces a numeric answer to a number", async () => {
      setTty(true);
      const {prompter} = build(["8080"]);

      const result = await prompter.fillMissingParameters(NumberOptions, {});

      expect(result.port).toBe(8080);
      expect(typeof result.port).toBe("number");
    });

    it("re-asks until the answer is a valid number", async () => {
      setTty(true);
      const {prompter, prompt, output} = build(["abc", "8080"]);

      const result = await prompter.fillMissingParameters(NumberOptions, {});

      expect(result.port).toBe(8080);
      expect(prompt.questions).toHaveLength(2);
      expect(output.lines.length).toBeGreaterThan(0);
    });

    it("lists enum choices and re-asks until a valid one is given", async () => {
      setTty(true);
      const {prompter, prompt, output} = build(["xml", "esm"]);

      const result = await prompter.fillMissingParameters(EnumOptions, {});

      expect(prompt.questions[0]).toBe("Format? (esm/cjs) ");
      expect(result.format).toBe("esm");
      expect(output.lines.length).toBeGreaterThan(0);
    });

    it("re-asks when a string max-length constraint is violated", async () => {
      setTty(true);
      const {prompter, prompt, output} = build(["toolong", "ok"]);

      const result = await prompter.fillMissingParameters(MaxLengthOptions, {});

      expect(result.shortName).toBe("ok");
      expect(prompt.questions).toHaveLength(2);
      expect(output.lines.length).toBeGreaterThan(0);
    });

    it("gives up after the attempt budget and leaves the value unset", async () => {
      setTty(true);
      const {prompter, prompt, output} = build(["a", "b", "c", "d", "e"]);

      const result = await prompter.fillMissingParameters(NumberOptions, {});

      expect(result.port).toBeUndefined();
      expect(prompt.questions).toHaveLength(5);
      expect(output.lines.some((line) => line.includes("after 5 attempts"))).toBe(true);
    });
  });
});
