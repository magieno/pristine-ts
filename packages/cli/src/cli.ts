import {EnvironmentManager, ExecutionContextKeynameEnum, Kernel, PristineEnvironment, PristineEnvironmentConfigurationKey} from "@pristine-ts/core";
import {AppModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {CommandInterface} from "./interfaces/command.interface";
import {AppModuleLoader} from "./bootstrap/app-module-loader";
import {BuildManifestChecker} from "./bootstrap/build-manifest-checker";
import {BuildManifestReader} from "./bootstrap/build-manifest-reader";
import {BuildRunner} from "./bootstrap/build-runner";
import {BuildStalenessPrompt} from "./bootstrap/build-staleness-prompt";
import {DynamicImporter} from "./bootstrap/dynamic-importer";
import {PluginLoader} from "./bootstrap/plugin-loader";
import {SourceHasher} from "./bootstrap/source-hasher";
import {ConfigLoader} from "./config/config-loader";
import {CliModule} from "./cli.module";
import {CliErrorReporter} from "./reporters/cli-error.reporter";

/**
 * Boots the CLI: discovers the consumer's AppModule, starts the kernel, and dispatches
 * `process.argv` to whichever command matches. Returns the process exit code rather than
 * exiting itself — `bin.ts` does `new Cli().bootstrap().then(process.exit)`.
 *
 * **Error handling is internal.** Every throw — from `appModuleLoader.load()`,
 * `kernel.start()`, or the dispatched command — funnels through `reportFatalError` and
 * gets rendered via `CliErrorReporter`. The bin doesn't need its own catch.
 *
 * **Per-call state.** `kernel` and `configuration` live as instance fields so they're
 * available to `reportFatalError` and `warnOnCommandCollisions` without threading them
 * through method parameters. One `Cli` instance per `bootstrap()` invocation — the
 * lifetime matches the CLI process.
 *
 * **No DI.** The kernel container does not exist yet during boot — the bootstrap-layer
 * collaborators (loaders, discoverers, cache, prompt) are hand-wired in `build()`. Once
 * the kernel is up, it registers itself into its own container so commands can inject it.
 */
export class Cli {
  private kernel?: Kernel;
  private configuration?: Record<string, unknown>;

  public async bootstrap(): Promise<number> {
    try {
      const appModuleLoader = this.buildAppModuleLoader();
      const loaded = await appModuleLoader.load();
      this.configuration = loaded.configuration as Record<string, unknown>;

      this.kernel = new Kernel();
      // Wrap the user's AppModule with CliModule so the CLI's own commands (`build`,
      // `start`, `verify`, `init`, `help`, `list`, `info`, custom commands) are always
      // registered when the bin is the entry point — regardless of whether the user's
      // AppModule already imports CliModule. The kernel dedupes modules by keyname during
      // start, so wrapping when CliModule is already in the graph is a no-op; we don't
      // bother walking the graph to detect that case.
      await this.kernel.start(this.wrapWithCliModule(loaded.appModule), loaded.configuration);

      // Make the running kernel resolvable from within commands so things like `pristine start`
      // and the alias commands can register signal handlers and resolve their delegates.
      this.kernel.container.registerInstance(Kernel, this.kernel);

      this.warnOnCommandCollisions();

      await this.kernel.handle(process.argv, {keyname: ExecutionContextKeynameEnum.Cli, context: null});
      // The CLI event handler calls `process.exit(exitCode)` itself after the command runs,
      // so this return is only reached if the dispatcher somehow resolves without exiting —
      // treat that as a success exit.
      return 0;
    } catch (error) {
      return this.reportFatalError(error);
    }
  }

  /**
   * Renders any error that escapes the boot/dispatch flow and returns the exit code the
   * bin should pass to `process.exit`.
   *
   * Three resolution paths for `EnvironmentManager`, picked in order of "most likely to be
   * correctly configured":
   *
   *   1. **Kernel up**: resolve `CliErrorReporter` (and its `EnvironmentManager`) through DI.
   *      This is the path for command-runtime errors — the configuration system already ran
   *      and `pristine.environment` is whatever the user configured.
   *
   *   2. **Configuration loaded but kernel-start failed**: build the manager from the raw
   *      `configuration` object that `AppModuleLoader.load()` produced. `pristine.config.ts`
   *      controls the mode just like it would in the running app.
   *
   *   3. **Configuration not loaded** (load itself threw): default to production. Boot-time
   *      errors get sanitized — set `pristine.environment: "dev"` in your config (or fix the
   *      load error) to see verbose output.
   *
   * No `process.env` reads in any branch — the environment flows exclusively through the
   * configuration system, same as every other framework setting.
   */
  private reportFatalError(error: unknown): number {
    if (this.kernel !== undefined) {
      try {
        const reporter = this.kernel.container.resolve(CliErrorReporter);
        return reporter.report(error);
      } catch {
        // Kernel container couldn't produce a reporter (kernel may have started but DI is
        // in a weird state). Fall through to the manual-build path.
      }
    }

    const rawEnvironment = (this.configuration?.[PristineEnvironmentConfigurationKey] as string | undefined) ?? PristineEnvironment.Production;
    const environmentManager = new EnvironmentManager(rawEnvironment);
    const reporter = new CliErrorReporter(environmentManager);
    return reporter.report(error);
  }

  /**
   * Builds a synthetic outer AppModule that imports both the user's AppModule and CliModule.
   * The wrap is unconditional — the kernel dedupes module imports by keyname, so adding
   * CliModule on top of a graph that already contains it is a no-op rather than an error
   * or duplicate registration. Cheaper than walking the user's import tree to detect the
   * already-present case.
   */
  private wrapWithCliModule(appModule: AppModuleInterface): AppModuleInterface {
    return {
      keyname: `${appModule.keyname}.with-cli`,
      importModules: [appModule, CliModule],
      importServices: appModule.importServices ?? [],
    };
  }

  /**
   * Hand-wired graph of the bootstrap-layer classes. The kernel container does not exist
   * yet, so we cannot resolve via DI — but the class graph here is shallow and stable, so
   * manual wiring stays readable. Each class is `@injectable()` so DI resolution would also
   * work if we ever moved this into a kernel-pre-boot container.
   */
  private buildAppModuleLoader(): AppModuleLoader {
    const dynamicImporter = new DynamicImporter();
    const configLoader = new ConfigLoader(dynamicImporter);
    const pluginLoader = new PluginLoader(dynamicImporter);
    const sourceHasher = new SourceHasher();
    const buildManifestReader = new BuildManifestReader();
    const buildManifestChecker = new BuildManifestChecker(sourceHasher);
    const buildStalenessPrompt = new BuildStalenessPrompt(dynamicImporter);
    const buildRunner = new BuildRunner();
    return new AppModuleLoader(
      configLoader,
      pluginLoader,
      dynamicImporter,
      buildManifestReader,
      buildManifestChecker,
      buildStalenessPrompt,
      buildRunner,
    );
  }

  /**
   * Walks every registered Command-tagged service and warns to stderr if multiple share a
   * `name`. The CLI's event dispatcher picks whichever match it sees first — without this
   * warning, a plugin silently shadowing a built-in command (or two plugins shadowing each
   * other) would be invisible until someone debugged "why is my command not running?".
   * Warning rather than throwing keeps the bin runnable; users decide whether to fix the
   * conflict.
   */
  private warnOnCommandCollisions(): void {
    if (this.kernel === undefined) return;

    let commands: CommandInterface<any>[];
    try {
      // ── container.resolveAll, justified ───────────────────────────────────────
      // Per CLAUDE.md: framework bootstrap. This runs from `Cli.bootstrap()` — pre-DI
      // hand-wiring, no constructor to inject into. The whole point is to enumerate
      // every registered Command for collision detection, which is inherently a
      // container-introspection operation.
      commands = this.kernel.container.resolveAll<CommandInterface<any>>(ServiceDefinitionTagEnum.Command);
    } catch {
      return;
    }

    const byName = new Map<string, number>();
    for (const command of commands) {
      byName.set(command.name, (byName.get(command.name) ?? 0) + 1);
    }

    for (const [name, count] of byName.entries()) {
      if (count > 1) {
        process.stderr.write(
          `[pristine] WARNING: command '${name}' is registered ${count} times. Only the first match will be dispatched.\n`,
        );
      }
    }
  }
}

