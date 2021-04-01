import {ModuleInterface} from "@pristine-ts/common";
import {ConfigurationDefinition} from "./configurations/configuration.definition";
import {dynamicTableNameRegistry} from "./decorators/dynamic-table-name.decorator";
import {DynamoDbTable} from "@aws/dynamodb-data-mapper";
import {LoggingModule, LogHandler} from "@pristine-ts/logging";
import {DependencyContainer} from "tsyringe";


export * from "./clients/clients";
export * from "./configurations/configurations";
export * from "./decorators/decorators";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./event-parsers/event-parsers";
export * from "./event-payloads/event-payloads";
export * from "./interfaces/interfaces";
export * from "./models/models";

export const AwsModule: ModuleInterface = {
    keyname: "pristine.aws",
    configurationDefinition: ConfigurationDefinition,
    importServices: [],
    importModules: [LoggingModule],
    providerRegistrations: [
    ],
    async afterInit(container): Promise<void> {
        registerDynamicTableNames(container);
    }
}

const registerDynamicTableNames = (container: DependencyContainer) => {
    for (const dynamicTableName of dynamicTableNameRegistry) {
        try {
            dynamicTableName.classConstructor.prototype[DynamoDbTable] = container.resolve(dynamicTableName.tokenName);
        } catch (e){
            const logHandler = container.resolve(LogHandler);
            logHandler.warning("The table token name does not exist in the container.");
        }
    }
}
