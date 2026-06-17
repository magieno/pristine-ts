import "reflect-metadata";
import {ValidationError} from "@pristine-ts/common";
import {IsNotEmpty, IsString, Validator} from "@pristine-ts/class-validator";
import {
  AutoDataMappingBuilder,
  BooleanNormalizer,
  DataMapper,
  DateNormalizer,
  NumberNormalizer,
  StringNormalizer,
} from "@pristine-ts/data-mapping";
import {CommandOptionsResolver} from "./command-options-resolver";
import {CommandParameterPrompter} from "./command-parameter-prompter";
import {commandParameter} from "../decorators/command-parameter.decorator";

/** Minimal `CliPrompt` stand-in that replays scripted answers for both readers. */
class FakeCliPrompt {
  constructor(private readonly answers: string[] = []) {
  }

  async readLine(): Promise<string> {
    return this.answers.shift() ?? "";
  }

  async readSecret(): Promise<string> {
    return this.answers.shift() ?? "";
  }
}

const buildDataMapper = (): DataMapper => new DataMapper(
  new AutoDataMappingBuilder(),
  [new StringNormalizer(), new NumberNormalizer(), new BooleanNormalizer(), new DateNormalizer()],
  [],
);

class WizardOptions {
  @commandParameter({question: "Project name?"})
  @IsString()
  @IsNotEmpty()
  name!: string;
}

const buildResolver = (answers: string[], enabled: boolean): CommandOptionsResolver => {
  const prompter = new CommandParameterPrompter(
    new FakeCliPrompt(answers) as any,
    {writeLine: (): void => {}} as any,
    new Validator(),
    buildDataMapper(),
    enabled,
  );
  return new CommandOptionsResolver(new Validator(), buildDataMapper(), prompter);
};

describe("CommandOptionsResolver", () => {
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

  it("prompts for a missing parameter and returns a validated instance", async () => {
    setTty(true);
    const resolver = buildResolver(["astra"], true);

    const result = await resolver.resolve(WizardOptions, {});

    expect(result).toBeInstanceOf(WizardOptions);
    expect(result.name).toBe("astra");
  });

  it("uses the seed rawArgs without prompting when the value is already present", async () => {
    setTty(true);
    const resolver = buildResolver(["unused"], true);

    const result = await resolver.resolve(WizardOptions, {name: "seeded"});

    expect(result.name).toBe("seeded");
  });

  it("throws ValidationError when a required value cannot be filled (non-interactive)", async () => {
    setTty(false);
    const resolver = buildResolver([], true);

    await expect(resolver.resolve(WizardOptions, {})).rejects.toBeInstanceOf(ValidationError);
  });
});
