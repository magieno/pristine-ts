import {createInterface} from "readline";
import {DependencyContainer, inject, injectable} from "tsyringe";
import {IdentityInterface, moduleScoped, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {McpModuleKeyname} from "../mcp.module.keyname";
import {McpDispatcher} from "../dispatchers/mcp.dispatcher";
import {JsonRpcErrorCodeEnum} from "../enums/json-rpc-error-code.enum";
import {McpMethodEnum} from "../enums/mcp-method.enum";
import {JsonRpcResponseInterface} from "../interfaces/json-rpc-response.interface";

/**
 * The stdio transport: one JSON-RPC message per line on the input, one per line on the output.
 * Run it from a CLI command; the MCP client starts that command as a subprocess.
 *
 * ```ts
 * @tag(ServiceDefinitionTagEnum.Command)
 * @injectable()
 * export class McpServeCommand implements CommandInterface<McpServeCommandOptions> {
 *   constructor(private readonly mcpStdioTransport: McpStdioTransport) {}
 *
 *   async run(): Promise<ExitCode> {
 *     await this.mcpStdioTransport.listen();
 *     return ExitCode.Success;
 *   }
 * }
 * ```
 *
 * Requests are served concurrently. `notifications/cancelled` aborts the `signal` of the matching
 * call, and nothing more is written for it. `listen` resolves when the input closes and every
 * call in flight has finished.
 *
 * Only MCP messages may reach the output: route the application logs to stderr
 * (`pristine.logging.consoleLogger*Stream`), or turn the console logger off.
 */
@moduleScoped(McpModuleKeyname)
@injectable()
export class McpStdioTransport {
  public constructor(private readonly dispatcher: McpDispatcher,
                     @inject(ServiceDefinitionTagEnum.CurrentChildContainer) private readonly container: DependencyContainer,
                     @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {
  }

  /**
   * Serves messages until the input closes.
   *
   * @param input The stream the client writes to. Defaults to `process.stdin`.
   * @param output The stream the client reads. Defaults to `process.stdout`.
   * @param identity The caller, if the command authenticated one (stdio takes credentials from
   * the environment, not from the protocol).
   */
  public async listen(input: NodeJS.ReadableStream = process.stdin,
                      output: NodeJS.WritableStream = process.stdout,
                      identity?: IdentityInterface): Promise<void> {
    const inFlight = new Map<string | number, AbortController>();
    const pending = new Set<Promise<void>>();
    const lines = createInterface({input, crlfDelay: Infinity});

    for await (const line of lines) {
      if (line.trim() === "") {
        continue;
      }

      let message: any;

      try {
        message = JSON.parse(line);
      } catch {
        this.write(output, {jsonrpc: "2.0", error: {code: JsonRpcErrorCodeEnum.ParseError, message: "The message is not valid JSON."}});
        continue;
      }

      if (message?.method === McpMethodEnum.NotificationsCancelled && message.id === undefined) {
        inFlight.get(message.params?.requestId)?.abort(message.params?.reason);
        continue;
      }

      const promise = this.serve(message, output, inFlight, identity)
        .finally(() => pending.delete(promise));
      pending.add(promise);
    }

    await Promise.all(pending);
  }

  private async serve(message: any,
                      output: NodeJS.WritableStream,
                      inFlight: Map<string | number, AbortController>,
                      identity?: IdentityInterface): Promise<void> {
    const id = typeof message?.id === "string" || typeof message?.id === "number" ? message.id : undefined;
    const controller = new AbortController();

    if (id !== undefined) {
      inFlight.set(id, controller);
    }

    try {
      const result = await this.dispatcher.dispatch(message, {
        container: this.container,
        identity,
        signal: controller.signal,
      });

      // A cancelled request gets no further message, not even its response.
      if (result.response !== undefined && controller.signal.aborted === false) {
        this.write(output, result.response);
      }
    } catch (error) {
      this.logHandler.error("The MCP stdio transport failed to serve a message.", {
        extra: {
          error,
          message,
        },
      });

      if (id !== undefined && controller.signal.aborted === false) {
        this.write(output, {jsonrpc: "2.0", id, error: {code: JsonRpcErrorCodeEnum.InternalError, message: "Internal error."}});
      }
    } finally {
      if (id !== undefined) {
        inFlight.delete(id);
      }
    }
  }

  /**
   * `JSON.stringify` escapes every newline inside strings, so a message always fits on one line.
   */
  private write(output: NodeJS.WritableStream, response: JsonRpcResponseInterface): void {
    output.write(JSON.stringify(response) + "\n");
  }
}
