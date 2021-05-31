import {ModuleInterface} from "@pristine-ts/common";
import {dynamicTableNameRegistry} from "./decorators/dynamic-table-name.decorator";
import {DynamoDbTable} from "@awslabs-community-fork/dynamodb-data-mapper";
import {LoggingModule, LogHandler} from "@pristine-ts/logging";
import {DependencyContainer} from "tsyringe";
import {DynamodbClient} from "./clients/dynamodb.client";
import {DynamodbEventParser} from "./event-parsers/dynamodb.event-parser";
import {S3EventParser} from "./event-parsers/s3.event-parser";
import {SnsEventParser} from "./event-parsers/sns.event-parser";
import {SqsEventParser} from "./event-parsers/sqs.event-parser";
import {HttpRequestMapper} from "./mappers/http-request.mapper";
import {MethodMapper} from "./mappers/method.mapper";
import {RequestMapper} from "./mappers/request.mapper";
import {ResponseMapper} from "./mappers/response.mapper";
import {RestApiRequestMapper} from "./mappers/rest-api-request.mapper";
import {RequestMapperFactory} from "./factories/request-mapper.factory";
import {AwsModuleKeyname} from "./aws.module.keyname";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {TelemetryModule} from "@pristine-ts/telemetry";
import {EnvironmentVariableResolver} from "@pristine-ts/configuration";

export * from "./clients/clients";
export * from "./decorators/decorators";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./event-parsers/event-parsers";
export * from "./event-payloads/event-payloads";
export * from "./factories/factories";
export * from "./interfaces/interfaces";
export * from "./mappers/mappers";
export * from "./models/models";
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
        }
    ],
    importServices: [
        DynamodbClient,

        DynamodbEventParser,
        S3EventParser,
        SnsEventParser,
        SqsEventParser,

        RequestMapperFactory,

        HttpRequestMapper,
        MethodMapper,
        RequestMapper,
        ResponseMapper,
        RestApiRequestMapper,
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
            const logHandler: LogHandlerInterface = container.resolve("LogHandlerInterface");
            logHandler.warning("The table token name does not exist in the container.");
            continue;
        }
        try {
            dynamicTableName.classConstructor.prototype[DynamoDbTable] = container.resolve(dynamicTableName.tokenName);
        } catch (error){
            const logHandler: LogHandlerInterface = container.resolve("LogHandlerInterface");
            logHandler.error("Error resolving the dynamic table token name", {error, tokenName: dynamicTableName.tokenName});
            continue;
        }
    }
}
