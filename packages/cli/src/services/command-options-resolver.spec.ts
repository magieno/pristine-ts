import "reflect-metadata";
import {ExitCode, UsageError} from "@pristine-ts/common";
import {IsNotEmpty, IsString, MaxLength, Validator} from "@pristine-ts/class-validator";
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
import {CommandArgumentErrorFormatter} from "./command-argument-error-formatter";
import {CommandUsageRenderer} from "./command-usage-renderer";
import {ProgramNameResolver} from "./program-name-resolver";
import {CliErrorCode} from "../errors/cli-error-code.enum";
import {commandParameter} from "../decorators/command-parameter.decorator";

/** Minimal `CliPrompt` stand-in that replays scripted answers for both readers + select. */
class FakeCliPrompt {
  constructor(private readonly answers: string[] = []) {
  }

  async readLine(): Promise<string> {
    return this.answers.shift() ?? "";
  }

  async readSecret(): Promise<string> {
    return this.answers.shift() ?? "";
  }

  async select(_message: string, choices: {value: any}[]): Promise<any> {
    return choices[0]?.value;
  }
}

const buildDataMapper = (): DataMapper => new DataMapper(
  new AutoDataMappingBuilder(),
  [new StringNormalizer(), new NumberNormalizer(), new BooleanNormalizer(), new DateNormalizer()],
  [],
);

/** Stand-in child container that simply news up a referenced provider class. */
const noopContainer = {resolve: (ctor: any) => new ctor()} as any;

class WizardOptions {
  @commandParameter({question: "Project name?"})
  @IsString()
  @IsNotEmpty()
  name!: string;
}

class ShortNameOptions {
  @commandParameter()
  @IsString()
  @MaxLength(3)
  name!: string;
}

const buildResolver = (answers: string[], enabled: boolean): CommandOptionsResolver => {
  const prompter = new CommandParameterPrompter(
    new FakeCliPrompt(answers) as any,
    {writeLine: (): void => {}} as any,
    new Validator(),
    buildDataMapper(),
    enabled,
    noopContainer,
  );
  const formatter = new CommandArgumentErrorFormatter(new CommandUsageRenderer());
  return new CommandOptionsResolver(new Validator(), buildDataMapper(), prompter, formatter, new ProgramNameResolver(""));
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

  it("throws a plain Usage UsageError (exit 64) when a required value is missing (non-interactive)", async () => {
    setTty(false);
    const resolver = buildResolver([], true);

    const error: any = await resolver.resolve(WizardOptions, {}, {commandName: "init"}).catch((e) => e);

    expect(error).toBeInstanceOf(UsageError);
    expect(error.message).toContain("Usage:");
    expect(error.message).toContain("init");
    expect(error.message).toContain("--name=<name>");
    expect(error.options.plain).toBe(true);
    expect(error.options.exitCode).toBe(ExitCode.Usage);
    expect(error.options.code).toBe(CliErrorCode.MissingRequiredArgument);
  });

  it("throws a plain Invalid UsageError when a supplied value is invalid (non-interactive)", async () => {
    setTty(false);
    const resolver = buildResolver([], true);

    const error: any = await resolver.resolve(ShortNameOptions, {name: "toolong"}, {commandName: "init"}).catch((e) => e);

    expect(error).toBeInstanceOf(UsageError);
    expect(error.message.startsWith("Invalid name 'toolong'. ")).toBe(true);
    expect(error.options.code).toBe(CliErrorCode.InvalidArgument);
    expect(error.options.exitCode).toBe(ExitCode.Usage);
  });
});
