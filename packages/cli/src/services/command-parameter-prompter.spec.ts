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
import {CommandParameterChoicesProviderInterface} from "../interfaces/command-parameter-choices-provider.interface";
import {CommandParameterChoicesContext} from "../interfaces/command-parameter-choices-context.interface";

/**
 * Stand-in for `CliPrompt` that records the questions / menus it was asked and replays a queue
 * of scripted answers + menu selections, so prompting can be asserted without a real terminal.
 */
class FakeCliPrompt {
  public readonly questions: string[] = [];
  public readonly secretQuestions: string[] = [];
  public readonly selectCalls: Array<{message: string; choices: {name: string; value: any}[]}> = [];

  constructor(private readonly answers: string[] = [], private readonly selections: any[] = []) {
  }

  async readLine(question: string): Promise<string> {
    this.questions.push(question);
    return this.answers.shift() ?? "";
  }

  async readSecret(question: string): Promise<string> {
    this.secretQuestions.push(question);
    return this.answers.shift() ?? "";
  }

  async select(message: string, choices: {name: string; value: any}[]): Promise<any> {
    this.selectCalls.push({message, choices});
    return this.selections.length > 0 ? this.selections.shift() : choices[0]?.value;
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

/** Stand-in child container that simply news up a referenced provider class. */
const noopContainer = {resolve: (ctor: any) => new ctor()};

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

class SensitiveOptions {
  @commandParameter({question: "Database password?", sensitive: true})
  @IsString()
  password?: string;
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

class StaticChoicesOptions {
  @commandParameter({question: "Environment?", choices: ["dev", "staging", "prod"]})
  @IsString()
  env?: string;
}

class ObjectChoicesOptions {
  @commandParameter({question: "Region?", choices: [{name: "US East", value: "us-east-1"}, {name: "EU West", value: "eu-west-1"}]})
  @IsString()
  region?: string;
}

class FnChoicesOptions {
  @commandParameter({question: "Branch?", choices: (ctx: CommandParameterChoicesContext) => (ctx.args.available as string[]) ?? ["main"]})
  @IsString()
  branch?: string;
}

class AsyncFnChoicesOptions {
  @commandParameter({question: "Tag?", choices: async () => ["v1", "v2"]})
  @IsString()
  tag?: string;
}

class StubChoicesProvider implements CommandParameterChoicesProviderInterface {
  async getChoices(): Promise<{name: string; value: string}[]> {
    return [{name: "Alpha", value: "a"}, {name: "Beta", value: "b"}];
  }
}

class ProviderChoicesOptions {
  @commandParameter({question: "Pick?", choices: StubChoicesProvider})
  @IsString()
  pick?: string;
}

class FailingChoicesOptions {
  @commandParameter({question: "X?", choices: () => {
    throw new Error("boom");
  }})
  @IsString()
  x?: string;
}

class EmptyChoicesOptions {
  @commandParameter({question: "Y?", choices: []})
  @IsString()
  y?: string;
}

const build = (answers: string[] = [], enabled = true, selections: any[] = [], container: any = noopContainer): {prompter: CommandParameterPrompter; prompt: FakeCliPrompt; output: CapturingCliOutput} => {
  const prompt = new FakeCliPrompt(answers, selections);
  const output = new CapturingCliOutput();
  const prompter = new CommandParameterPrompter(prompt as any, output as any, new Validator(), buildDataMapper(), enabled, container);
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

    it("re-asks when a string max-length constraint is violated", async () => {
      setTty(true);
      const {prompter, prompt, output} = build(["toolong", "ok"]);

      const result = await prompter.fillMissingParameters(MaxLengthOptions, {});

      expect(result.shortName).toBe("ok");
      expect(prompt.questions).toHaveLength(2);
      expect(output.lines.length).toBeGreaterThan(0);
    });

    it("reads a sensitive value through the masked reader, not the plain reader", async () => {
      setTty(true);
      const {prompter, prompt} = build(["s3cr3t"]);

      const result = await prompter.fillMissingParameters(SensitiveOptions, {});

      expect(prompt.secretQuestions).toEqual(["Database password? "]);
      expect(prompt.questions).toEqual([]);
      expect(result.password).toBe("s3cr3t");
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

  describe("prompting (choices)", () => {
    it("presents an enum as an arrow-key menu and returns the picked value (no free-text)", async () => {
      setTty(true);
      const {prompter, prompt} = build([], true, ["esm"]);

      const result = await prompter.fillMissingParameters(EnumOptions, {});

      expect(prompt.selectCalls).toHaveLength(1);
      expect(prompt.selectCalls[0].message).toBe("Format?");
      expect(prompt.selectCalls[0].choices.map((c) => c.value)).toEqual(["esm", "cjs"]);
      expect(prompt.questions).toEqual([]);
      expect(result.format).toBe("esm");
    });

    it("presents a static string choices array as a menu", async () => {
      setTty(true);
      const {prompter, prompt} = build([], true, ["staging"]);

      const result = await prompter.fillMissingParameters(StaticChoicesOptions, {});

      expect(prompt.selectCalls[0].choices.map((c) => c.value)).toEqual(["dev", "staging", "prod"]);
      expect(result.env).toBe("staging");
    });

    it("uses {name,value} choice objects verbatim in the menu", async () => {
      setTty(true);
      const {prompter, prompt} = build([], true, ["eu-west-1"]);

      const result = await prompter.fillMissingParameters(ObjectChoicesOptions, {});

      expect(prompt.selectCalls[0].choices).toEqual([{name: "US East", value: "us-east-1"}, {name: "EU West", value: "eu-west-1"}]);
      expect(result.region).toBe("eu-west-1");
    });

    it("resolves choices from a function with access to the already-resolved args", async () => {
      setTty(true);
      const {prompter, prompt} = build([], true, ["release"]);

      const result = await prompter.fillMissingParameters(FnChoicesOptions, {available: ["main", "release"]});

      expect(prompt.selectCalls[0].choices.map((c) => c.value)).toEqual(["main", "release"]);
      expect(result.branch).toBe("release");
    });

    it("awaits an async resolver function", async () => {
      setTty(true);
      const {prompter, prompt} = build([], true, ["v2"]);

      const result = await prompter.fillMissingParameters(AsyncFnChoicesOptions, {});

      expect(prompt.selectCalls[0].choices.map((c) => c.value)).toEqual(["v1", "v2"]);
      expect(result.tag).toBe("v2");
    });

    it("resolves a provider class from the container and uses its choices", async () => {
      setTty(true);
      const resolved: any[] = [];
      const container = {resolve: (ctor: any) => {
        resolved.push(ctor);
        return new ctor();
      }};
      const {prompter, prompt} = build([], true, ["b"], container);

      const result = await prompter.fillMissingParameters(ProviderChoicesOptions, {});

      expect(resolved).toContain(StubChoicesProvider);
      expect(prompt.selectCalls[0].choices.map((c) => c.value)).toEqual(["a", "b"]);
      expect(result.pick).toBe("b");
    });

    it("falls back to free-text when a dynamic resolver throws", async () => {
      setTty(true);
      const {prompter, prompt, output} = build(["typed-value"], true, []);

      const result = await prompter.fillMissingParameters(FailingChoicesOptions, {});

      expect(prompt.selectCalls).toHaveLength(0);
      expect(prompt.questions).toHaveLength(1);
      expect(result.x).toBe("typed-value");
      expect(output.lines.some((line) => line.includes("Could not load choices"))).toBe(true);
    });

    it("falls back to free-text when choices resolve empty", async () => {
      setTty(true);
      const {prompter, prompt} = build(["typed"], true, []);

      const result = await prompter.fillMissingParameters(EmptyChoicesOptions, {});

      expect(prompt.selectCalls).toHaveLength(0);
      expect(prompt.questions).toHaveLength(1);
      expect(result.y).toBe("typed");
    });
  });
});
