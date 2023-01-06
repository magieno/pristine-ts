import {CoreModule} from "@pristine-ts/core";
import {ModuleInterface} from "@pristine-ts/common";
import {OpenSearchModuleKeyname} from "./open-search.module.keyname";
import {AwsModule} from "@pristine-ts/aws";
import {EnvironmentVariableResolver} from "@pristine-ts/configuration";
import {ElasticSearchModuleKeyname} from "../dist/types/elastic-search.module.keyname";
import {NetworkingModule} from "@pristine-ts/networking";
import {OpenSearchClient} from "./clients/open-search.client";
import {RequestQueryParser} from "./parsers/request-query.parser";

export * from "./clients/clients";
export * from "./models/models";
export * from "./parsers/parsers";

export * from "./open-search.module.keyname";

export const OpenSearchModule: ModuleInterface = {
    keyname: OpenSearchModuleKeyname,
    configurationDefinitions: [
        {
            parameterName: ElasticSearchModuleKeyname + ".domain-url",
            isRequired: true,
            defaultResolvers: [
                new EnvironmentVariableResolver("PRISTINE_OPENSEARCH_DOMAIN_URL"),
            ]
        },
    ],
    importModules: [
        AwsModule,
        CoreModule,
    ],
}


