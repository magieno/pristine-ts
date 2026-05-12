import "reflect-metadata";
import {IsNumber, IsOptional, IsString, Validator} from "@pristine-ts/class-validator";
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
 * a real terminal. Also satisfies the ConsoleManager surface area the handler reaches for.
 */
class CapturingConsole {
  public lines: string[] = [];

  writeLine(message: string): void {
    this.lines.push(message);
  }

  writeError(message: string): void {
    this.lines.push(`ERROR: ${message}`);
  }

  // The handler also touches these via injection but doesn't call them in the tested paths.
  // Stubbed as no-ops so any accidental call is silent rather than throwing on a missing
  // method and masking the real assertion failure.
  writeSuccess(message: string): void { this.lines.push(`SUCCESS: ${message}`); }
  writeWarning(message: string): void { this.lines.push(`WARNING: ${message}`); }
  writeInfo(message: string): void { this.lines.push(`INFO: ${message}`); }
  write(message: string): void { this.lines.push(message); }
}

/**
 * Builds a CliEventHandler with real DataMapper + Validator and a capturing console. The
 * handler's only inputs we want to vary across tests are `command` and `rawArgs`; everything
 * else stays the same so each test is small.
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

      const result = await handler.resolveArgs(command, {anything: 123, other: "string"});

      expect(result.args).toEqual({anything: 123, other: "string"});
      expect(result.exitCode).toBeUndefined();
    });

    it("substitutes empty object when raw args are missing", async () => {
      const {handler} = buildHandler();
      const command: CommandInterface<any> = {
        name: "legacy",
        optionsType: null,
        run: async () => ExitCodeEnum.Success,
      };

      const result = await handler.resolveArgs(command, {});

      expect(result.args).toEqual({});
      expect(result.exitCode).toBeUndefined();
    });
  });

  describe("when optionsType is a class constructor", () => {
    it("returns a real instance of the options class", async () => {
      const {handler} = buildHandler();

      const result = await handler.resolveArgs(fixtureCommand(), {port: 4000});

      expect(result.exitCode).toBeUndefined();
      expect(result.args).toBeInstanceOf(FixtureOptions);
      expect(result.args.port).toBe(4000);
    });

    it("leaves optional fields undefined when no flag is passed", async () => {
      const {handler} = buildHandler();

      const result = await handler.resolveArgs(fixtureCommand(), {});

      expect(result.exitCode).toBeUndefined();
      expect(result.args).toBeInstanceOf(FixtureOptions);
      expect(result.args.port).toBeUndefined();
      expect(result.args.address).toBeUndefined();
      expect(result.args.enabled).toBeUndefined();
    });

    it("preserves a string address through mapping", async () => {
      const {handler} = buildHandler();

      const result = await handler.resolveArgs(fixtureCommand(), {address: "127.0.0.1"});

      expect(result.exitCode).toBeUndefined();
      expect(result.args.address).toBe("127.0.0.1");
    });

    it("preserves a boolean flag through mapping", async () => {
      const {handler} = buildHandler();

      const result = await handler.resolveArgs(fixtureCommand(), {enabled: true});

      expect(result.exitCode).toBeUndefined();
      expect(result.args.enabled).toBe(true);
    });

    it("rejects bad input with a non-zero exit code and prints the constraint", async () => {
      const {handler, console: captured} = buildHandler();

      // CommandEventMapper would normally normalize "notANumber" to a string. We pass it
      // explicitly here to exercise the @IsNumber failure path.
      const result = await handler.resolveArgs(fixtureCommand(), {port: "notANumber"});

      expect(result.args).toBeUndefined();
      expect(result.exitCode).toBe(ExitCodeEnum.Error);
      const joined = captured.lines.join("\n");
      expect(joined).toContain("port");
      // @pristine-ts/class-validator's constraint key for @IsNumber is `IS_NUMBER`.
      expect(joined).toContain("IS_NUMBER");
      // The constraint message itself ("must be a number ...") should also surface — proves
      // we extract `constraint.message` correctly rather than rendering `[object Object]`.
      expect(joined).toContain("must be a number");
    });

    it("includes ALL failing constraints when multiple fields are bad", async () => {
      const {handler, console: captured} = buildHandler();

      const result = await handler.resolveArgs(fixtureCommand(), {port: "x", address: 42});

      expect(result.exitCode).toBe(ExitCodeEnum.Error);
      const joined = captured.lines.join("\n").toLowerCase();
      expect(joined).toContain("port");
      expect(joined).toContain("address");
    });
  });
});
