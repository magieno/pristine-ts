import {ModuleInterface} from "@pristine-ts/common";
import {ConfigurationDefinition} from "./configurations/configuration.definition";
import {dynamicTableNameRegistry} from "./decorators/dynamic-table-name.decorator";
import {DynamoDbTable} from "@aws/dynamodb-data-mapper";
import {LoggingModule, LogHandler} from "@pristine-ts/logging";
import {DependencyContainer} from "tsyringe";
import {DynamodbClient} from "./clients/dynamodb.client";
import {DynamodbEventParser} from "./event-parsers/dynamodb.event-parser";
import {S3EventParser} from "./event-parsers/s3.event-parser";
import {SnsEventParser} from "./event-parsers/sns.event-parser";
import {SqsEventParser} from "./event-parsers/sqs.event-parser";


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
    importServices: [
        DynamodbClient,

        DynamodbEventParser,
        S3EventParser,
        SnsEventParser,
        SqsEventParser,
    ],
    importModules: [LoggingModule],
    providerRegistrations: [
    ],
    async afterInit(container): Promise<void> {
        registerDynamicTableNames(container);
    }
}

const registerDynamicTableNames = (container: DependencyContainer) => {
    for (const dynamicTableName of dynamicTableNameRegistry) {
        if(container.isRegistered(dynamicTableName.tokenName) === false) {
            const logHandler = container.resolve(LogHandler);
            logHandler.warning("The table token name does not exist in the container.");
            continue;
        }
        try {
            dynamicTableName.classConstructor.prototype[DynamoDbTable] = container.resolve(dynamicTableName.tokenName);
        } catch (error){
            const logHandler = container.resolve(LogHandler);
            logHandler.error("Error resolving the dynamic table token name", {error, tokenName: dynamicTableName.tokenName});
            continue;
        }
    }
}
