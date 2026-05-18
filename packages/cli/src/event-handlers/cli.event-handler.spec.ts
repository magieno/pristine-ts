import "reflect-metadata";
import {IsNumber, IsOptional, IsString, Validator} from "@pristine-ts/class-validator";
import {PristineError, UsageError, ValidationError} from "@pristine-ts/common";
import {CommandInterface} from "../interfaces/command.interface";
import {ExitCodeEnum} from "../enums/exit-code.enum";
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
 * Captures everything the handler writes to console so tests can assert on output without
 * a real terminal. Still required because the handler may write status lines via
 * `consoleManager.writeLine` even on the success path.
 */
class CapturingConsole {
  public lines: string[] = [];

  writeLine(message: string): void {
    this.lines.push(message);
  }

  writeError(message: string): void {
    this.lines.push(`ERROR: ${message}`);
  }

  writeSuccess(message: string): void { this.lines.push(`SUCCESS: ${message}`); }
  writeWarning(message: string): void { this.lines.push(`WARNING: ${message}`); }
  writeInfo(message: string): void { this.lines.push(`INFO: ${message}`); }
  write(message: string): void { this.lines.push(message); }
}

/**
 * Builds a CliEventHandler with real Validator and a capturing console. The handler's only
 * inputs we want to vary across tests are `command` and `rawArgs`; everything else stays
 * the same so each test is small.
 */
const buildHandler = (): {handler: CliEventHandler; console: CapturingConsole} => {
  const captured = new CapturingConsole();
  const validator = new Validator();
  const handler = new CliEventHandler(
    {error: () => {}, info: () => {}, debug: () => {}, warning: () => {}, critical: () => {}, notice: () => {}, terminate: () => {}} as any,
    validator,
    captured as any,
    [],
  );
  return {handler, console: captured};
};

const fixtureCommand = (overrides: Partial<CommandInterface<FixtureOptions>> = {}): CommandInterface<FixtureOptions> => ({
  name: "fixture",
  optionsType: FixtureOptions,
  run: async () => ExitCodeEnum.Success,
  ...overrides,
});

describe("CliEventHandler.resolveArgs", () => {
  describe("when optionsType is null (legacy escape hatch)", () => {
    it("passes raw args through unchanged", async () => {
      const {handler} = buildHandler();
      const command: CommandInterface<any> = {
        name: "legacy",
        optionsType: null,
        run: async () => ExitCodeEnum.Success,
      };

      const args = await handler.resolveArgs(command, {anything: 123, other: "string"});

      expect(args).toEqual({anything: 123, other: "string"});
    });

    it("substitutes empty object when raw args are missing", async () => {
      const {handler} = buildHandler();
      const command: CommandInterface<any> = {
        name: "legacy",
        optionsType: null,
        run: async () => ExitCodeEnum.Success,
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
