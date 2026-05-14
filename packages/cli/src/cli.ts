import {ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
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

/**
 * Boots the CLI: discovers the consumer's AppModule, starts the kernel, and dispatches
 * `process.argv` to whichever command matches. Exported so `bin.ts` can call it explicitly
 * — the auto-invoke at module load was removed so library consumers importing this file for
 * its types or `bootstrap` reference do not accidentally trigger an entire kernel boot.
 *
 * The bootstrap-layer collaborators (loaders, discoverers, cache, prompt) are instantiated
 * by hand here rather than resolved through DI. The kernel container does not exist yet at
 * this point, so DI is not available — manually wiring the (small, stable) class graph is the
 * least surprising option. Once the kernel is up, the kernel itself is registered into its
 * own container so commands can inject it.
 */
export const bootstrap = async (): Promise<void> => {
  const appModuleLoader = buildAppModuleLoader();
  const {appModule, configuration} = await appModuleLoader.load();

  const kernel = new Kernel();
  // Wrap the user's AppModule with CliModule so the CLI's own commands (`build`,
  // `start`, `verify`, `init`, `help`, `list`, `info`, custom commands) are always
  // registered when the bin is the entry point — regardless of whether the user's
  // AppModule already imports CliModule. The kernel dedupes modules by keyname during
  // start, so wrapping when CliModule is already in the graph is a no-op; we don't
  // bother walking the graph to detect that case.
  await kernel.start(wrapWithCliModule(appModule), configuration);

  // Make the running kernel resolvable from within commands so things like `pristine start`
  // and the alias commands can register signal handlers and resolve their delegates.
  kernel.container.registerInstance(Kernel, kernel);

  warnOnCommandCollisions(kernel);

  await kernel.handle(process.argv, {keyname: ExecutionContextKeynameEnum.Cli, context: null});
}

/**
 * Hand-wired graph of the bootstrap-layer classes. The kernel container does not exist yet,
 * so we cannot resolve via DI — but the class graph here is shallow and stable, so manual
 * wiring stays readable. Each class is `@injectable()` so DI resolution would also work if
 * we ever moved this into a kernel-pre-boot container.
 */
/**
 * Builds a synthetic outer AppModule that imports both the user's AppModule and CliModule.
 * The wrap is unconditional — the kernel dedupes module imports by keyname, so adding
 * CliModule on top of a graph that already contains it is a no-op rather than an error
 * or duplicate registration. Cheaper than walking the user's import tree to detect the
 * already-present case.
 */
const wrapWithCliModule = (appModule: AppModuleInterface): AppModuleInterface => {
  return {
    keyname: `${appModule.keyname}.with-cli`,
    importModules: [appModule, CliModule],
    importServices: appModule.importServices ?? [],
  };
}

const buildAppModuleLoader = (): AppModuleLoader => {
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
 * other) would be invisible until someone debugged "why is my command not running?". Warning
 * rather than throwing keeps the bin runnable; users decide whether to fix the conflict.
 */
const warnOnCommandCollisions = (kernel: Kernel): void => {
  let commands: CommandInterface<any>[];
  try {
    commands = kernel.container.resolveAll<CommandInterface<any>>(ServiceDefinitionTagEnum.Command);
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
