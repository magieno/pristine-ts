import {ModuleInterface} from "@pristine-ts/common";
import {dynamicTableNameRegistry} from "./decorators/dynamic-table-name.decorator";
import {DynamoDbTable} from "@awslabs-community-fork/dynamodb-data-mapper";
import {LoggingModule, LogHandlerInterface} from "@pristine-ts/logging";
import {DependencyContainer} from "tsyringe";
import {AwsModuleKeyname} from "./aws.module.keyname";
import {BooleanResolver, EnumResolver, EnvironmentVariableResolver} from "@pristine-ts/configuration";
import {CoreModule} from "@pristine-ts/core";
import {ApiGatewayEventsHandlingStrategyEnum} from "./enums/api-gateway-events-handling-strategy.enum";

export * from "./clients/clients";
export * from "./decorators/decorators";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./event-payloads/event-payloads";
export * from "./factories/factories";
export * from "./interfaces/interfaces";
export * from "./mappers/mappers";
export * from "./models/models";
export * from "./resolvers/resolvers";
export * from "./types/types";

export * from "./aws.module.keyname";

export const AwsModule: ModuleInterface = {
    keyname: AwsModuleKeyname,
    configurationDefinitions: [
        {
            parameterName: AwsModuleKeyname + ".region",
            isRequired: false,
            defaultValue: "us-east-1",
            defaultResolvers: [
                new EnvironmentVariableResolver("AWS_REGION"),
            ]
        },
        {
            parameterName: AwsModuleKeyname + ".api_gateway.rest_api_events.handling_strategy",
            isRequired: false,
            defaultValue: ApiGatewayEventsHandlingStrategyEnum.Request,
            defaultResolvers: [
                new EnumResolver(new EnvironmentVariableResolver("PRISTINE_AWS_API_GATEWAY_REST_API_EVENTS_HANDLING_STRATEGY"), ApiGatewayEventsHandlingStrategyEnum),
            ],
        },
        {
            parameterName: AwsModuleKeyname + ".api_gateway.http_request_events.handling_strategy",
            isRequired: false,
            defaultValue: ApiGatewayEventsHandlingStrategyEnum.Request,
            defaultResolvers: [
                new EnumResolver(new EnvironmentVariableResolver("PRISTINE_AWS_API_GATEWAY_HTTP_REQUEST_EVENTS_HANDLING_STRATEGY"), ApiGatewayEventsHandlingStrategyEnum),
            ],
        }
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
                logHandler.debug("The table token name was not registered, trying to load default.", {tokenName: dynamicTableName.tokenName}, AwsModuleKeyname)
                const value = await new EnvironmentVariableResolver(dynamicTableName.tokenName).resolve();
                container.registerInstance(dynamicTableName.tokenName, value);
                logHandler.debug("Successfully registered table name.", {tokenName: dynamicTableName.tokenName, value}, AwsModuleKeyname)
            } catch (e) {
                logHandler.warning("The table token name does not exist in the container.", {tokenName: dynamicTableName.tokenName}, AwsModuleKeyname);
                continue;
            }
        }
        // Set the DynamoDbTable symbol with the name of the table.
        try {
            dynamicTableName.classConstructor.prototype[DynamoDbTable] = container.resolve(dynamicTableName.tokenName);
        } catch (error){
            const logHandler: LogHandlerInterface = container.resolve("LogHandlerInterface");
            logHandler.error("Error resolving the dynamic table token name", {error, tokenName: dynamicTableName.tokenName}, AwsModuleKeyname);
            continue;
        }
    }
}
