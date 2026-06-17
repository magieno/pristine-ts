import "reflect-metadata";
import {IsNotEmpty, IsNumber, IsOptional, IsString, Validator} from "@pristine-ts/class-validator";
import {PristineError, UsageError, ValidationError, ExitCode} from "@pristine-ts/common";
import {
  AutoDataMappingBuilder,
  BooleanNormalizer,
  DataMapper,
  DateNormalizer,
  NumberNormalizer,
  StringNormalizer,
} from "@pristine-ts/data-mapping";
import {CommandInterface} from "../interfaces/command.interface";
import {CliEventHandler} from "./cli.event-handler";
import {CommandArgumentResolver} from "../services/command-argument-resolver";
import {CommandOptionsResolver} from "../services/command-options-resolver";
import {CommandParameterPrompter} from "../services/command-parameter-prompter";
import {CliPrompt} from "../managers/cli-prompt.manager";
import {DynamicImporter} from "../bootstrap/dynamic-importer";

/**
 * Builds a `DataMapper` with the same normalizers `DataMappingModule` ships, so the
 * resolver under test behaves like it does in a real kernel.
 */
const buildDataMapper = (): DataMapper => new DataMapper(
  new AutoDataMappingBuilder(),
  [new StringNormalizer(), new NumberNormalizer(), new BooleanNormalizer(), new DateNormalizer()],
  [],
);

/**
 * Options class with mixed types — covers the four mapping/validation paths the handler
 * must support: optional number, optional string, optional boolean, decorated validation.
 */
class FixtureOptions {
  @IsOptional()
  @IsNumber()
  port?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  enabled?: boolean;
}

/**
 * Fixture with a required field — used to trigger a real `ValidationError`. With
 * `DataMapper.autoMap`'s type coercion, an empty/missing required value is one of the
 * remaining reliable ways to fail validation: a wrong-typed value (e.g. `"notANumber"`
 * for a number) just gets normalized through and would pass `IsNumber`.
 */
class FixtureRequiredOptions {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

/**
 * Captures everything the handler emits through its injected LogHandlerInterface so tests
 * can assert on output without a real terminal.
 */
class CapturingLogHandler {
  public lines: string[] = [];
  info(message: string): void { this.lines.push(`INFO: ${message}`); }
  success(message: string): void { this.lines.push(`SUCCESS: ${message}`); }
  error(message: string): void { this.lines.push(`ERROR: ${message}`); }
  warning(message: string): void { this.lines.push(`WARNING: ${message}`); }
  notice(message: string): void { this.lines.push(`NOTICE: ${message}`); }
  debug(message: string): void { this.lines.push(`DEBUG: ${message}`); }
  critical(message: string): void { this.lines.push(`CRITICAL: ${message}`); }
  terminate(): void {}
}

/**
 * Builds a CliEventHandler with real Validator and a capturing log handler. The handler's
 * only inputs we want to vary across tests are `command` and `rawArgs`; everything else
 * stays the same so each test is small.
 */
const buildHandler = (): {handler: CliEventHandler; logHandler: CapturingLogHandler} => {
  const captured = new CapturingLogHandler();
  const validator = new Validator();
  const prompter = new CommandParameterPrompter(new CliPrompt(new DynamicImporter()), {writeLine: (): void => {}} as any, validator, buildDataMapper(), false);
  const optionsResolver = new CommandOptionsResolver(validator, buildDataMapper(), prompter);
  const handler = new CliEventHandler(
    captured as any,
    new CommandArgumentResolver(optionsResolver),
    [],
  );
  return {handler, logHandler: captured};
};

const fixtureCommand = (overrides: Partial<CommandInterface<FixtureOptions>> = {}): CommandInterface<FixtureOptions> => ({
  name: "fixture",
  optionsType: FixtureOptions,
  run: async () => ExitCode.Success,
  ...overrides,
});

const fixtureRequiredCommand = (): CommandInterface<FixtureRequiredOptions> => ({
  name: "fixture-required",
  optionsType: FixtureRequiredOptions,
  run: async () => ExitCode.Success,
});

describe("CliEventHandler.resolveArgs", () => {
  describe("when optionsType is null (legacy escape hatch)", () => {
    it("passes raw args through unchanged", async () => {
      const {handler} = buildHandler();
      const command: CommandInterface<any> = {
        name: "legacy",
        optionsType: null,
        run: async () => ExitCode.Success,
      };

      const args = await handler.resolveArgs(command, {anything: 123, other: "string"});

      expect(args).toEqual({anything: 123, other: "string"});
    });

    it("substitutes empty object when raw args are missing", async () => {
      const {handler} = buildHandler();
      const command: CommandInterface<any> = {
        name: "legacy",
        optionsType: null,
        run: async () => ExitCode.Success,
      };

      const args = await handler.resolveArgs(command, {});

      expect(args).toEqual({});
    });
  });

  describe("when optionsType is a class constructor", () => {
    it("returns a real instance of the options class", async () => {
      const {handler} = buildHandler();

      const args = await handler.resolveArgs(fixtureCommand(), {port: 4000});

      expect(args).toBeInstanceOf(FixtureOptions);
      expect(args.port).toBe(4000);
    });

    it("leaves optional fields undefined when no flag is passed", async () => {
      const {handler} = buildHandler();

      const args = await handler.resolveArgs(fixtureCommand(), {});

      expect(args).toBeInstanceOf(FixtureOptions);
      expect(args.port).toBeUndefined();
      expect(args.address).toBeUndefined();
      expect(args.enabled).toBeUndefined();
    });

    it("preserves a string address through mapping", async () => {
      const {handler} = buildHandler();

      const args = await handler.resolveArgs(fixtureCommand(), {address: "127.0.0.1"});

      expect(args.address).toBe("127.0.0.1");
    });

    it("preserves a boolean flag through mapping", async () => {
      const {handler} = buildHandler();

      const args = await handler.resolveArgs(fixtureCommand(), {enabled: true});

      expect(args.enabled).toBe(true);
    });

    it("coerces a numeric string into a number via DataMapper's NumberNormalizer", async () => {
      const {handler} = buildHandler();

      // Under `plainToInstance` this would have stayed `"4000"` (string) and tripped
      // `IsNumber`. `DataMapper.autoMap` normalizes through its registered normalizers,
      // so the string becomes a real number and validation passes.
      const args = await handler.resolveArgs(fixtureCommand(), {port: "4000"});

      expect(args.port).toBe(4000);
      expect(typeof args.port).toBe("number");
    });

    it("throws a ValidationError with structured details when a required field fails validation", async () => {
      const {handler} = buildHandler();

      // FixtureRequiredOptions.name is `@IsString @IsNotEmpty` — an empty mapping fails
      // `IsNotEmpty` reliably even after DataMapper's coercion.
      const promise = handler.resolveArgs(fixtureRequiredCommand(), {});

      await expect(promise).rejects.toBeInstanceOf(ValidationError);
      await expect(promise).rejects.toMatchObject({
        options: expect.objectContaining({
          code: "ARGUMENT_VALIDATION_FAILED",
          details: expect.objectContaining({
            name: expect.any(Array),
          }),
        }),
      });
    });
  });
});
