/**
 * A long-running server orchestrated by `pristine start`. Implementations (an HTTP server,
 * a gRPC server, a websocket listener, etc.) tag themselves with
 * `ServiceDefinitionTagEnum.RuntimeServer` and `pristine start` resolves them all and calls
 * `start()` on each. Graceful shutdown is the module's responsibility — typically wired via
 * `ModuleInterface.onShutdown` calling the server's `stop()`.
 *
 * Why the layer exists: `pristine start` cannot directly import from `@pristine-ts/http`
 * (that would invert the dependency direction — http already depends on cli). This interface
 * lets the cli orchestrate any number of server types without knowing about any of them
 * specifically. Modules opt in by implementing and tagging.
 */
export interface RuntimeServerInterface {
  /**
   * A short label for log lines and diagnostic output (e.g. "http", "https", "grpc").
   * Implementations should keep it stable across restarts so log filtering works.
   */
  name: string;

  /**
   * Boots the server and returns once it is accepting requests. The optional overrides let
   * `pristine start` propagate runtime flags like `--port` / `--address` to whichever server
   * cares to honor them. Implementations are free to ignore overrides that don't apply.
   */
  start(overrides?: { port?: number; address?: string }): Promise<void>;

  /**
   * Drains and shuts the server down. Should be idempotent — `pristine start` may call it
   * after `Kernel.stop()` has already triggered an `onShutdown`-driven stop.
   */
  stop(): Promise<void>;
}
