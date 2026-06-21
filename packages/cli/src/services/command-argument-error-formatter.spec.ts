import "reflect-metadata";
import {ExitCode, UsageError} from "@pristine-ts/common";
import {IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, Validator} from "@pristine-ts/class-validator";
import {
  AutoDataMappingBuilder,
  AutoDataMappingBuilderOptions,
  BooleanNormalizer,
  DataMapper,
  DateNormalizer,
  NumberNormalizer,
  StringNormalizer,
} from "@pristine-ts/data-mapping";
import {CommandArgumentErrorFormatter} from "./command-argument-error-formatter";
import {CommandUsageRenderer} from "./command-usage-renderer";
import {CliErrorCode} from "../errors/cli-error-code.enum";
import {commandParameter} from "../decorators/command-parameter.decorator";

const buildDataMapper = (): DataMapper => new DataMapper(
  new AutoDataMappingBuilder(),
  [new StringNormalizer(), new NumberNormalizer(), new BooleanNormalizer(), new DateNormalizer()],
  [],
);

class AddOptions {
  @commandParameter({valueHint: "name"})
  @IsString()
  @IsNotEmpty()
  name!: string;

  @commandParameter({flag: "pubkey", valueHint: "key-or-file"})
  @IsOptional()
  @IsString()
  pubkey?: string;

  @commandParameter()
  @IsOptional()
  @IsBoolean()
  rotate?: boolean;
}

class NameOptions {
  @commandParameter({errorMessage: "Invalid name '%value%'. Use lowercase letters, digits and dashes."})
  @IsString()
  @MaxLength(2)
  name!: string;
}

class PlainOptions {
  @commandParameter()
  @IsString()
  @MaxLength(2)
  name!: string;
}

class SecretOptions {
  @commandParameter({sensitive: true})
  @IsString()
  @MaxLength(2)
  token!: string;
}

const formatter = new CommandArgumentErrorFormatter(new CommandUsageRenderer());
const validator = new Validator();
const context = {commandName: "key:add", binName: "myapp"};

const validate = async (optionsType: any, raw: Record<string, any>): Promise<{mapped: any; errors: any[]}> => {
  const mapped = await buildDataMapper().autoMap(raw, optionsType, new AutoDataMappingBuilderOptions({throwOnErrors: false}));
  const errors = await validator.validate(mapped);
  return {mapped, errors};
};

describe("CommandArgumentErrorFormatter", () => {
  it("renders the Usage synopsis when a required value is missing", async () => {
    const {mapped, errors} = await validate(AddOptions, {});

    const error = formatter.buildValidationError(AddOptions, mapped, errors, context);

    expect(error).toBeInstanceOf(UsageError);
    expect(error.message).toBe("Usage: myapp key:add --name=<name> [--pubkey=<key-or-file>] [--rotate]");
    expect(error.options.plain).toBe(true);
    expect(error.options.exitCode).toBe(ExitCode.Usage);
    expect(error.options.code).toBe(CliErrorCode.MissingRequiredArgument);
    expect(error.options.details).toMatchObject({missing: "name"});
  });

  it("uses the errorMessage override with %value% for a supplied-but-invalid value", async () => {
    const {mapped, errors} = await validate(NameOptions, {name: "Web"});

    const error = formatter.buildValidationError(NameOptions, mapped, errors, context);

    expect(error.message).toBe("Invalid name 'Web'. Use lowercase letters, digits and dashes.");
    expect(error.options.plain).toBe(true);
    expect(error.options.exitCode).toBe(ExitCode.Usage);
    expect(error.options.code).toBe(CliErrorCode.InvalidArgument);
  });

  it("falls back to the validator's own message, without the [CONSTRAINT] prefix", async () => {
    const {mapped, errors} = await validate(PlainOptions, {name: "Web"});

    const error = formatter.buildValidationError(PlainOptions, mapped, errors, context);

    expect(error.message.startsWith("Invalid name 'Web'. ")).toBe(true);
    expect(error.message).not.toContain("[");
  });

  it("never echoes a sensitive value", async () => {
    const {mapped, errors} = await validate(SecretOptions, {token: "abcdef"});

    const error = formatter.buildValidationError(SecretOptions, mapped, errors, context);

    expect(error.message.startsWith("Invalid token. ")).toBe(true);
    expect(error.message).not.toContain("abcdef");
  });
});
