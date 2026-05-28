import {ModuleInterface} from "@pristine-ts/common";
import {DependencyContainer} from "tsyringe";
import {LoggingModule, LogHandlerInterface} from "@pristine-ts/logging";
import {CoreModule} from "@pristine-ts/core";
import {EnvironmentVariableResolver} from "@pristine-ts/configuration";
import {GcpModuleKeyname} from "./gcp.module.keyname";
import {
  dynamicCollectionNameRegistry,
  FirestoreCollection,
} from "./decorators/dynamic-collection-name.decorator";

export * from "./clients/clients";
export * from "./decorators/decorators";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./event-payloads/event-payloads";
export * from "./interfaces/interfaces";
export * from "./mappers/mappers";
export * from "./models/models";

export * from "./gcp.module.keyname";

export * from "./gcp.configuration-keys";
export const GcpModule: ModuleInterface = {
  keyname: GcpModuleKeyname,
  configurationDefinitions: [
    /**
     * The GCP project id. Required for every GCP client; corresponds to the standard
     * `GOOGLE_CLOUD_PROJECT` environment variable.
     */
    {
      parameterName: GcpModuleKeyname + ".projectId",
      isRequired: true,
      defaultResolvers: [
        new EnvironmentVariableResolver("GOOGLE_CLOUD_PROJECT"),
        new EnvironmentVariableResolver("GCP_PROJECT"),
      ],
    },
    /**
     * The default GCP region.
     */
    {
      parameterName: GcpModuleKeyname + ".region",
      isRequired: false,
      defaultValue: "us-central1",
      defaultResolvers: [
        new EnvironmentVariableResolver("GOOGLE_CLOUD_REGION"),
      ],
    },
    /**
     * Optional path to a service-account key file. When unset, the GCP SDKs use
     * Application Default Credentials (ADC).
     */
    {
      parameterName: GcpModuleKeyname + ".credentials",
      isRequired: false,
      defaultValue: "",
      defaultResolvers: [
        new EnvironmentVariableResolver("GOOGLE_APPLICATION_CREDENTIALS"),
      ],
    },
  ],
  importModules: [
    LoggingModule,
    CoreModule,
  ],
  providerRegistrations: [],
  async afterInit(container): Promise<void> {
    await registerDynamicCollectionNames(container);
  },
};

/**
 * Walks `dynamicCollectionNameRegistry` and stamps the resolved collection name onto
 * each registered class's prototype under the `FirestoreCollection` symbol. Mirrors
 * `registerDynamicTableNames` in `@pristine-ts/aws`.
 *
 * @param container The dependency container.
 */
const registerDynamicCollectionNames = async (container: DependencyContainer) => {
  // ── container.resolve / container.isRegistered, justified (entire function) ────
  // Per CLAUDE.md: module lifecycle hook + dynamic registry. This is invoked from
  // the GcpModule's lifecycle (not from any service), iterating over a registry of
  // decorator-collected classes whose dynamic collection tokens are data on the
  // class. No class to constructor-inject into. The container.resolve calls below
  // are: LogHandler for diagnostics, the dynamic token for the actual collection
  // name lookup.
  for (const dynamicCollectionName of dynamicCollectionNameRegistry) {
    if (container.isRegistered(dynamicCollectionName.tokenName) === false) {
      const logHandler: LogHandlerInterface = container.resolve("LogHandlerInterface");
      try {
        logHandler.debug("GcpModule: The collection token name was not registered, trying to load default.", {
          extra: {tokenName: dynamicCollectionName.tokenName},
        });
        const value = await new EnvironmentVariableResolver(dynamicCollectionName.tokenName).resolve();
        container.registerInstance(dynamicCollectionName.tokenName, value);
        logHandler.debug("GcpModule: Successfully registered collection name.", {
          extra: {
            tokenName: dynamicCollectionName.tokenName,
            value,
          },
        });
      } catch (e) {
        logHandler.warning("GcpModule: The collection token name does not exist in the container.", {
          extra: {tokenName: dynamicCollectionName.tokenName},
        });
        continue;
      }
    }
    try {
      dynamicCollectionName.classConstructor.prototype[FirestoreCollection] = container.resolve(
        dynamicCollectionName.tokenName,
      );
    } catch (error) {
      const logHandler: LogHandlerInterface = container.resolve("LogHandlerInterface");
      logHandler.error("GcpModule: Error resolving the dynamic collection token name.", {
        extra: {
          error,
          tokenName: dynamicCollectionName.tokenName,
        },
      });
    }
  }
};
