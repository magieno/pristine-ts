import {ModuleInterface} from "@pristine-ts/common";
import {HttpModuleKeyname} from "./http.module.keyname";
import {LoggingModule} from "@pristine-ts/logging";
import {BooleanResolver, EnvironmentVariableResolver, NumberResolver} from "@pristine-ts/configuration";
import {CliModule} from "@pristine-ts/cli";
import {KernelHttpServer} from "./servers/kernel.http-server";

export * from "./http.module.keyname";
export * from "./commands/commands";
export * from "./clients/clients";
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
  importModules: [LoggingModule, CliModule],
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
