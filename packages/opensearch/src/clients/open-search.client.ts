import {Query} from "../models/query.model";
import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {SearchResult} from "../models/search-result.model";
import {AwsModuleKeyname} from "@pristine-ts/aws";
import {OpenSearchModuleKeyname} from "../open-search.module.keyname";
import {defaultProvider} from "@aws-sdk/credential-provider-node"; // V3 SDK.
import {ApiResponse, Client, RequestParams} from '@opensearch-project/opensearch';
import {AwsSigv4Signer} from '@opensearch-project/opensearch/aws';
import {SearchResultAggregation} from "../models/search-result-aggregation.model";
import {SearchResultHit} from "../models/search-result-hit.model";
import {MultiMatchQueryTypeEnum} from "../enums/multi-match-query-type.enum";

@injectable()
export class OpenSearchClient {

    constructor(
        @inject(`%${OpenSearchModuleKeyname}.domain-url%`) private readonly domainUrl: string,
        @inject(`%${AwsModuleKeyname}.region%`) private readonly region: string,
        @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) { }

    getClient() {
        return new Client({
            ...AwsSigv4Signer({
                region: this.region,
                getCredentials: () => {
                    const credentialsProvider = defaultProvider();
                    return credentialsProvider();
                },
            }),
            node: this.domainUrl, // OpenSearch domain URL
        });
    }

    async parseResponse<T>(response: ApiResponse, currentPage?: number, maximumNumberOfResultsPerPage?: number): Promise<SearchResult<T>> {
        const searchResult = new SearchResult<T>();
        searchResult.currentPage = currentPage ?? searchResult.currentPage;
        searchResult.maximumNumberOfResultsPerPage = maximumNumberOfResultsPerPage ?? searchResult.maximumNumberOfResultsPerPage;
        searchResult.numberOfReturnedResults = response?.body?.hits?.hits?.length ?? searchResult.numberOfReturnedResults;
        searchResult.total = response?.body?.hits?.total?.value ?? searchResult.total;
        searchResult.hits = (response?.body?.hits?.hits ?? []).map( (result: any) => {
            const searchResultHit = new SearchResultHit();
            searchResultHit.id = result._id ?? searchResultHit.id;
            searchResultHit.index = result._index ?? searchResultHit.index;
            searchResultHit.score = result._score ?? searchResultHit.score;
            searchResultHit.data = result._source ?? searchResultHit.data;

            return searchResultHit;
        });

        if (response?.body?.aggregations) {

            const keys = Object.keys(response?.body?.aggregations);

            keys.forEach(key => {
                const aggregation = new SearchResultAggregation();
                aggregation.name = key;
                aggregation.results = [];

                for (const bucket of response?.body?.aggregations[key]?.buckets) {
                    aggregation.results.push({
                        value: bucket.key,
                        docCount: bucket.doc_count,
                    });
                }

                searchResult.aggregations.push(aggregation);
            });
        }

        return searchResult;
    }

    async search<T>(indexName: string, query: Query): Promise <SearchResult<T>> {
            try {
                const client = this.getClient();

                await this.logHandler.debug("OpenSearchClient: Searching for documents.", {extra: {query}});

                const startIndex = (query.page ? query.page - 1 : 0) * query.maximumNumberOfResultsPerPage;

                const params: RequestParams.Search<any> = {
                    index: indexName,
                    body: {
                        from: startIndex,
                        size: query.maximumNumberOfResultsPerPage,
                        sort: query.sort,
                        _source: {
                            excludes: query.excludeFieldsFromResponse,
                        },
                        query: {
                            bool: {
                                must: [],
                            },
                        },
                    },
                };

                if (query.query && query.query !== "") {
                    if (query.searchType === "query_string") {
                        params.body.query.bool.must.push({
                            query_string: {
                                query: query.query,
                                fields: query.fields,
                            },
                        });
                    }
                    if (query.searchType === "multi_match") {
                        params.body.query.bool.must.push({
                            multi_match: {
                                query: query.query,
                                fields: query.fields,
                                type: query.multiMatchType ?? MultiMatchQueryTypeEnum.CrossFields,
                                operator: query.searchOperator,
                            },
                        });
                    }
                }

                if (query.conditions && query.conditions.length > 0) {
                    for (const condition of query.conditions) {
                        params.body.query.bool.must.push({
                            term: condition,
                        });
                    }
                }

                if (query.aggregation) {
                    params.body.aggs = {
                        [query.aggregation.name]: {
                            terms: {
                                field: query.aggregation.term,
                                size: query.aggregation.size,
                                order: {
                                    [query.aggregation.sortOn]: query.aggregation.sortOrder,
                                },
                            },
                        },
                    };
                }

                if (query.range) {
                    params.body.query.bool.must.push({
                        range : query.range,
                    });
                }

                await this.logHandler.debug("OpenSearchClient: Querying OpenSearch with parameters.", {extra: {params}});

                const response = await client.search(params);

                await this.logHandler.debug("OpenSearchClient: Received response from OpenSearch.", {extra: {response, indexName, query}});

                return await this.parseResponse(response, query.page, query.maximumNumberOfResultsPerPage);
            } catch (e) {
                await this.logHandler.error("OpenSearchClient: Error while searching for documents.", {extra: {error: e, indexName, query}});

                throw e;
            }

    }

    async createIndex(name: string): Promise<void> {
        const response = await this.getClient().indices.create({
            index: name,
        });

        this.logHandler.debug("OpenSearchClient: Index creation response.", {extra: {name, response}})
    }


    async deleteIndex(name: string): Promise<void> {
        const response = await this.getClient().indices.delete({
            index: name,
        });

        this.logHandler.debug("OpenSearchClient: Index deletion response.", {extra: {name, response}})
    }

    async createDocument(indexName: string, id: string, document: any): Promise<void> {
        const response = this.getClient().create({
            index: indexName,
            id,
            body: document,
        });

        this.logHandler.debug("OpenSearchClient: Create document response.", {extra: {indexName, id, document, response}})
    }

    async indexDocument(indexName: string, id: string, document: any): Promise<void> {
        const response = await this.getClient().index({
            index: indexName,
            id,
            body: document,
        })

        this.logHandler.debug("OpenSearchClient: Index document response.", {extra: {indexName, id, document, response}})
    }

    async updateDocument(indexName: string, id: string, document: any): Promise<void> {
        const response = await this.getClient().update({
            index: indexName,
            id,
            body: document,
        })

        this.logHandler.debug("OpenSearchClient: Update document response.", {extra: {indexName, id, document, response}})
    }

    async deleteDocument(indexName: string, id: string): Promise<void>  {
        const response = await this.getClient().delete({
            index: indexName,
            id,
        })

        this.logHandler.debug("OpenSearchClient: Delete document response.", {extra: {indexName, id, response}})
    }

}
