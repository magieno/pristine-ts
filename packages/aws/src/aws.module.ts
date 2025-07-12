import {ModuleInterface} from "@pristine-ts/common";
import {dynamicTableNameRegistry} from "./decorators/dynamic-table-name.decorator";
import {DynamoDbTable} from "@awslabs-community-fork/dynamodb-data-mapper";
import {LoggingModule, LogHandlerInterface} from "@pristine-ts/logging";
import {DependencyContainer} from "tsyringe";
import {AwsModuleKeyname} from "./aws.module.keyname";
import {EnvironmentVariableResolver} from "@pristine-ts/configuration";
import {CoreModule} from "@pristine-ts/core";

export * from "./clients/clients";
export * from "./decorators/decorators";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./event-payloads/event-payloads";
export * from "./interfaces/interfaces";
export * from "./mappers/mappers";
export * from "./models/models";
export * from "./options/options";
export * from "./resolvers/resolvers";
export * from "./results/results";

export * from "./aws.module.keyname";

export const AwsModule: ModuleInterface = {
    keyname: AwsModuleKeyname,
    configurationDefinitions: [
        /**
         * The AWS region used.
         */
        {
            parameterName: AwsModuleKeyname + ".region",
            isRequired: false,
            defaultValue: "us-east-1",
            defaultResolvers: [
                new EnvironmentVariableResolver("AWS_REGION"),
            ]
        },
    ],
    importModules: [
        LoggingModule,
        CoreModule,
    ],
    providerRegistrations: [
    ],
    async afterInit(container): Promise<void> {
        await registerDynamicTableNames(container);
    }
}

/**
 * This method takes all the classes that were added to the dynamicTableNameRegistry and resolves the name of the table from the dependency container and sets the DynamoDbTable to this name.
 * @param container The dependency container.
 */
const registerDynamicTableNames = async (container: DependencyContainer) => {
    for (const dynamicTableName of dynamicTableNameRegistry) {
        // If the token name is not already registered in the container, we try to resolve it from the environment variables.
        if(container.isRegistered(dynamicTableName.tokenName) === false) {
            const logHandler: LogHandlerInterface = container.resolve("LogHandlerInterface");
            try {
                logHandler.debug("AwsModule: The table token name was not registered, trying to load default.", {extra: {tokenName: dynamicTableName.tokenName}}, AwsModuleKeyname)
                const value = await new EnvironmentVariableResolver(dynamicTableName.tokenName).resolve();
                container.registerInstance(dynamicTableName.tokenName, value);
                logHandler.debug("AwsModule: Successfully registered table name.", {extra: {tokenName: dynamicTableName.tokenName, value}}, AwsModuleKeyname)
            } catch (e) {
                logHandler.warning("AwsModule: The table token name does not exist in the container.", {extra: {tokenName: dynamicTableName.tokenName}}, AwsModuleKeyname);
                continue;
            }
        }
        // Set the DynamoDbTable symbol with the name of the table.
        try {
            dynamicTableName.classConstructor.prototype[DynamoDbTable] = container.resolve(dynamicTableName.tokenName);
        } catch (error){
            const logHandler: LogHandlerInterface = container.resolve("LogHandlerInterface");
            logHandler.error("AwsModule: Error resolving the dynamic table token name.", {extra: {error, tokenName: dynamicTableName.tokenName}}, AwsModuleKeyname);
            continue;
        }
    }
}
