import {UsageError} from "@pristine-ts/common";

/**
 * Thrown when the user invokes a CLI command name that isn't registered with the kernel.
 *
 * Extends `UsageError` (which carries `exitCode: 64` / `EX_USAGE`, `kind: PristineErrorKind.UserError`) so
 * the `CliErrorReporter` renders it as a clean one-line stderr message rather than a
 * crash dump. The unknown command name is preserved as a structured `details.commandName`
 * field, which surfaces under the error code in the stderr output.
 */
export class CommandNotFoundError extends UsageError {
  public constructor(
    public readonly commandName: string,
  ) {
    super(
      `There is no command found for name: '${commandName}'. Use the 'list' command to see the commands already registered.`,
      {
        code: "COMMAND_NOT_FOUND",
        details: {commandName},
      },
    );
  }
}
