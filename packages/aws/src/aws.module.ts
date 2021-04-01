import {ModuleInterface} from "@pristine-ts/common";
import {ConfigurationDefinition} from "./configurations/configuration.definition";
import {dynamicTableNameRegistry} from "./decorators/dynamic-table-name.decorator";
import {DynamoDbTable} from "@aws/dynamodb-data-mapper";


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
    importModules: [],
    providerRegistrations: [
    ],
    async onInit(container): Promise<void> {
        registerDynamicTableNames();
    }
}

const registerDynamicTableNames = () => {
    for (const dynamicTableName of dynamicTableNameRegistry) {
        // TODO: fetch the name from env variables
        dynamicTableName.classConstructor.prototype[DynamoDbTable] = dynamicTableName.name;
    }
}
