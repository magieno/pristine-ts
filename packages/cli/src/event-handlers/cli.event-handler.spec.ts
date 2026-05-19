import "reflect-metadata";
import {IsNumber, IsOptional, IsString, Validator} from "@pristine-ts/class-validator";
import {PristineError, UsageError, ValidationError, ExitCode} from "@pristine-ts/common";
import {CommandInterface} from "../interfaces/command.interface";
import {CliEventHandler} from "./cli.event-handler";

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
  const handler = new CliEventHandler(
    captured as any,
    validator,
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

    it("throws a ValidationError with structured details when validation fails", async () => {
      const {handler} = buildHandler();

      // The new error contract: bad input throws ValidationError. The bin's top-level
      // `.catch(cliErrorReporter.report)` is what renders this to stderr and picks the
      // exit code — the handler stays format-agnostic.
      const promise = handler.resolveArgs(fixtureCommand(), {port: "notANumber"});

      await expect(promise).rejects.toBeInstanceOf(ValidationError);
      await expect(promise).rejects.toMatchObject({
        options: expect.objectContaining({
          code: "ARGUMENT_VALIDATION_FAILED",
          details: expect.objectContaining({
            port: expect.arrayContaining([expect.stringContaining("IS_NUMBER")]),
          }),
        }),
      });
    });

    it("includes ALL failing fields in details when multiple constraints fail", async () => {
      const {handler} = buildHandler();

      const promise = handler.resolveArgs(fixtureCommand(), {port: "x", address: 42});

      await expect(promise).rejects.toMatchObject({
        options: expect.objectContaining({
          details: expect.objectContaining({
            port: expect.any(Array),
            address: expect.any(Array),
          }),
        }),
      });
    });
  });
});
