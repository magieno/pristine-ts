import {ModuleInterface} from "@pristine-ts/common";
import {HttpModuleKeyname} from "./http.module.keyname";
import {LoggingModule} from "@pristine-ts/logging";
import {CoreModule} from "@pristine-ts/core";
import {DataMappingModule} from "@pristine-ts/data-mapping";
import {ObservabilityModule} from "@pristine-ts/observability";
import {ValidationModule} from "@pristine-ts/validation";
import {BooleanResolver, EnvironmentVariableResolver, NumberResolver} from "@pristine-ts/configuration";
import {KernelHttpServer} from "./servers/kernel.http-server";

export * from "./http.module.keyname";
export * from "./commands/commands";
export * from "./clients/clients";
export * from "./cors/cors";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./interceptors/interceptors"
export * from "./interfaces/interfaces"
export * from "./options/options";
export * from "./servers/servers";
export * from "./utils/utils";
export * from "./wrappers/wrappers";

export * from "./http.configuration-keys";
export const HttpModule: ModuleInterface = {
  keyname: HttpModuleKeyname,
  // These are exactly the framework modules HttpModule's request pipeline depends on. CliModule is
  // deliberately absent: importing it would pull the entire `@pristine-ts/cli` package (every
  // command, the REPL event handlers, terminal/readline machinery, the build/plugin bootstrap, and
  // CLI-only config keys) into HTTP/Lambda runtimes and consumer ESM bundles, where none of it
  // runs. HttpModule's own `file-server:start` command still works under `pristine` because the CLI
  // bin (`Cli.bootstrap`) wraps the AppModule with CliModule, and the command — being
  // `@tag(Command)` — is then discovered from the container wherever HttpModule is loaded.
  importModules: [CoreModule, DataMappingModule, LoggingModule, ObservabilityModule, ValidationModule],
  configurationDefinitions: [
    {
      parameterName: `${HttpModuleKeyname}.logging-enabled`,
      defaultValue: true,
      isRequired: false,
      defaultResolvers: [
        new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_HTTP_LOGGING")),
      ]
    },
    {
      parameterName: `${HttpModuleKeyname}.http-server.file.address`,
      defaultValue: "127.0.0.1",
      isRequired: false,
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_HTTP_SERVER_FILE_ADDRESS"),
      ]
    },
    {
      parameterName: `${HttpModuleKeyname}.http-server.file.port`,
      defaultValue: 9000,
      isRequired: false,
      defaultResolvers: [
        new NumberResolver(new EnvironmentVariableResolver("PRISTINE_HTTP_SERVER_FILE_PORT")),
      ]
    },
    /**
     * Address the kernel-routed HTTP server (started by `pristine start`) binds to. Defaults
     * to `0.0.0.0` so the server is reachable from outside the container — typical for prod.
     * Set to `127.0.0.1` for local-only.
     */
    {
      parameterName: `${HttpModuleKeyname}.kernel-server.address`,
      defaultValue: "0.0.0.0",
      isRequired: false,
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_HTTP_KERNEL_SERVER_ADDRESS"),
      ]
    },
    /**
     * Port the kernel-routed HTTP server listens on. Defaults to 3000 (matches the convention
     * used by Express, Nest, and most Node frameworks).
     */
    {
      parameterName: `${HttpModuleKeyname}.kernel-server.port`,
      defaultValue: 3000,
      isRequired: false,
      defaultResolvers: [
        new NumberResolver(new EnvironmentVariableResolver("PRISTINE_HTTP_KERNEL_SERVER_PORT")),
      ]
    },
    /**
     * Path to the TLS private key (PEM). Setting this AND `tls.cert-path` switches the kernel
     * server from `http.Server` to `https.Server`. Empty string (the default) means "no TLS".
     */
    {
      parameterName: `${HttpModuleKeyname}.kernel-server.tls.key-path`,
      defaultValue: "",
      isRequired: false,
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_HTTP_KERNEL_SERVER_TLS_KEY_PATH"),
      ]
    },
    /**
     * Path to the TLS certificate (PEM). See `tls.key-path` — both must be set together.
     */
    {
      parameterName: `${HttpModuleKeyname}.kernel-server.tls.cert-path`,
      defaultValue: "",
      isRequired: false,
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_HTTP_KERNEL_SERVER_TLS_CERT_PATH"),
      ]
    },
    /**
     * Largest request body, in bytes, the kernel server buffers before answering
     * `413 Payload Too Large`. Checked against `Content-Length` before any byte is read, and
     * again while streaming a chunked body. Default 100 MB.
     */
    {
      parameterName: `${HttpModuleKeyname}.kernel-server.max-body-size`,
      defaultValue: 104857600,
      isRequired: false,
      defaultResolvers: [
        new NumberResolver(new EnvironmentVariableResolver("PRISTINE_HTTP_KERNEL_SERVER_MAX_BODY_SIZE")),
      ]
    },
    /**
     * CORS — handled by `CorsRequestHandler` inside `KernelHttpServer`'s request path. All keys
     * carry defaults so `@injectConfig` always resolves; CORS stays INACTIVE until
     * `cors.allowed-origins` (and/or `cors.allowed-hosts`) is set. List keys accept a
     * comma-separated string (env/default) or a `string[]` (programmatic config).
     *
     * Exact-match origin allowlist. Empty (the default) = CORS disabled: no preflight
     * short-circuit and no `Access-Control-Allow-Origin` echo. Never wildcarded.
     */
    {
      parameterName: `${HttpModuleKeyname}.cors.allowed-origins`,
      defaultValue: "",
      isRequired: false,
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_HTTP_CORS_ALLOWED_ORIGINS"),
      ]
    },
    /**
     * Methods advertised in the preflight `Access-Control-Allow-Methods` response.
     */
    {
      parameterName: `${HttpModuleKeyname}.cors.allowed-methods`,
      defaultValue: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
      isRequired: false,
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_HTTP_CORS_ALLOWED_METHODS"),
      ]
    },
    /**
     * Request headers advertised in the preflight `Access-Control-Allow-Headers` response.
     */
    {
      parameterName: `${HttpModuleKeyname}.cors.allowed-headers`,
      defaultValue: "Content-Type",
      isRequired: false,
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_HTTP_CORS_ALLOWED_HEADERS"),
      ]
    },
    /**
     * Response headers exposed to the browser via `Access-Control-Expose-Headers` on actual
     * responses. Empty (the default) omits the header entirely.
     */
    {
      parameterName: `${HttpModuleKeyname}.cors.exposed-headers`,
      defaultValue: "",
      isRequired: false,
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_HTTP_CORS_EXPOSED_HEADERS"),
      ]
    },
    /**
     * Seconds a browser may cache the preflight result (`Access-Control-Max-Age`).
     */
    {
      parameterName: `${HttpModuleKeyname}.cors.max-age`,
      defaultValue: 600,
      isRequired: false,
      defaultResolvers: [
        new NumberResolver(new EnvironmentVariableResolver("PRISTINE_HTTP_CORS_MAX_AGE")),
      ]
    },
    /**
     * When true, emit `Access-Control-Allow-Credentials: true` on preflight and actual responses
     * for allow-listed origins (lets the browser send cookies / `Authorization`).
     */
    {
      parameterName: `${HttpModuleKeyname}.cors.allow-credentials`,
      defaultValue: false,
      isRequired: false,
      defaultResolvers: [
        new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_HTTP_CORS_ALLOW_CREDENTIALS")),
      ]
    },
    /**
     * Chrome Private Network Access. When true, answer `Access-Control-Allow-Private-Network: true`
     * to a preflight that carries `Access-Control-Request-Private-Network: true` — required for a
     * public/secure site to call a loopback/private-network daemon.
     */
    {
      parameterName: `${HttpModuleKeyname}.cors.allow-private-network`,
      defaultValue: false,
      isRequired: false,
      defaultResolvers: [
        new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_HTTP_CORS_ALLOW_PRIVATE_NETWORK")),
      ]
    },
    /**
     * Optional `Host`-header allowlist (loopback DNS-rebinding defense). When set, a request whose
     * `Host` is not listed is rejected with `403` before routing. Empty (the default) disables the
     * check. Independent of `allowed-origins`.
     */
    {
      parameterName: `${HttpModuleKeyname}.cors.allowed-hosts`,
      defaultValue: "",
      isRequired: false,
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_HTTP_CORS_ALLOWED_HOSTS"),
      ]
    },
  ],
  onShutdown: async (container) => {
    // The KernelHttpServer self-tracks whether `start()` was actually called: if pristine start
    // never resolved it (e.g. an HTTP-less command like `pristine p:list` ran), stop() is a
    // no-op. So we can resolve unconditionally without worrying about creating a stray server.
    try {
      // ── container.resolve, justified ────────────────────────────────────────
      // Per CLAUDE.md: module lifecycle hook. `onShutdown` is a callback fired by
      // the kernel with the container as its argument — there's no class to
      // constructor-inject into. Same shape as a factory; resolving from the
      // provided container is the framework's intended path.
      const server = container.resolve(KernelHttpServer);
      await server.stop();
    } catch {
      // KernelHttpServer's deps (the address/port config values) might not be resolvable if
      // the container is in a degraded state during shutdown. Swallow — there's nothing useful
      // we can do, and other modules' onShutdown should still run.
    }
  },
}
