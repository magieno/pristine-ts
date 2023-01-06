import {Query} from "../models/query.model";
import {Aggregation} from "../models/aggregation.model";
import {Range} from "../models/range.model";
import {Request} from "@pristine-ts/common";
import {URL} from "url";
import {injectable} from 'tsyringe'

@injectable()
export class RequestQueryParser {

    parse(request: Request) {
        const elasticSearchQuery = new Query();

        const url = new URL(request.url);

        // Page
        const page = url.searchParams.get("page");

        if(page) {
            elasticSearchQuery.page = isNaN(+page) ? undefined : +page;
        }

        // Query
        const query = url.searchParams.get("query");
        const searchType = url.searchParams.get("search_type");
        const searchOperator = url.searchParams.get("search_operator");

        if (query && query != "") {
            elasticSearchQuery.query = query;
            if (searchType && (searchType === "multi_match" || searchType === "query_string")) {
                elasticSearchQuery.searchType = searchType;
                elasticSearchQuery.searchOperator = searchOperator as "and" | "or" ?? "and";
            }
        }

        // Fields
        const fields = url.searchParams.get("fields");
        if (fields) {
            elasticSearchQuery.fields = (fields as string).split(",");
        }

        // Exclude fields from Response
        const excludeFieldsFromResponse = url.searchParams.get("exclude_fields_from_response");
        if (excludeFieldsFromResponse) {
            elasticSearchQuery.excludeFieldsFromResponse = (excludeFieldsFromResponse as string).split(",");
        }

        // Maximum number of results per page
        const maximumNumberOfResultsPerPage = url.searchParams.get("maximum_number_of_results_per_page");
        if (maximumNumberOfResultsPerPage) {
            elasticSearchQuery.maximumNumberOfResultsPerPage = isNaN(+maximumNumberOfResultsPerPage) ? elasticSearchQuery.maximumNumberOfResultsPerPage : +maximumNumberOfResultsPerPage;
        }

        // Aggregation
        const aggregationName = url.searchParams.get("aggregation_name");
        const aggregationTerm = url.searchParams.get("aggregation_term");
        const aggregationSize = url.searchParams.get("aggregation_size");
        const aggregationSortOn = url.searchParams.get("aggregation_sort_on");
        const aggregationSortOrder = url.searchParams.get("aggregation_sort_order");

        if(aggregationName || aggregationTerm || aggregationSize) {
            elasticSearchQuery.aggregation = new Aggregation();
            elasticSearchQuery.aggregation.name = aggregationName ?? elasticSearchQuery.aggregation.name;
            elasticSearchQuery.aggregation.term = aggregationTerm ?? elasticSearchQuery.aggregation.term;

            if(aggregationSize) {
                elasticSearchQuery.aggregation.size = isNaN(+aggregationSize) ? elasticSearchQuery.aggregation.size : +aggregationSize;
            }

            switch (aggregationSortOn) {
                case 'term':
                    elasticSearchQuery.aggregation.sortOn = '_term';
                    break;
                case "count":
                    elasticSearchQuery.aggregation.sortOn = "_count";
                    break;
            }

            elasticSearchQuery.aggregation.sortOrder = aggregationSortOrder as "asc" | "desc" ?? elasticSearchQuery.aggregation.sortOrder;
        }

        // Sort
        const sort = url.searchParams.get("sort");

        if (sort) {
            elasticSearchQuery.sort = [];

            const sortingPairs = sort.split(',');
            for (const sortingPair of sortingPairs) {
                const pair = sortingPair.split(":");
                const term = pair[0];

                let order: "asc" | "desc" = "asc";
                if (pair[1] && (pair[1] === "desc" || pair[1] === "asc")) {
                    order = pair[1];
                }

                elasticSearchQuery.sort.push({
                    [term]: {
                        order,
                    },
                });
            }
        }

        // Conditions
        const conditions = url.searchParams.get("conditions");

        if (conditions) {
            elasticSearchQuery.conditions = [];

            const parsedConditions = conditions.split(',');
            for (const condition of parsedConditions) {
                const pair = condition.split(":");
                const term = pair[0];

                if (pair[1]) {
                    elasticSearchQuery.conditions.push({
                        [term]: pair[1],
                    });
                }

            }
        }

        /**
         * range_key : {string} The property on which the filter will be applied. E.g: createdAt.
         * range_conditions : {string} The condition(s), comma separated with no space, that will be applied. E.g: gte:5,lte:6 or gte:0.01
         * Available Conditions : gte (greater then equal), lte (less then equal), gt (greater then), lt (less then),
         * Followed by the value of that condition. For Date, use the Epoch number, since the date format is not in our ElasticSearch.
         * For more information : https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-range-query.html.
         */
        const rangeKey = url.searchParams.get("range_key");
        const rangeConditions = url.searchParams.get("range_conditions");
        if (rangeKey && typeof rangeConditions === "string") {

            elasticSearchQuery.range = {};
            const range = new Range();

            const conditions = rangeConditions.split(",");
            for (const condition of conditions) {
                const pair = condition.split(":");
                const term = pair[0];

                if (pair[1]) {
                    range[term] = isNaN(+pair[1]) ? pair[1] : +pair[1];
                }

            }

            elasticSearchQuery.range[rangeKey] = range;
        }

        return elasticSearchQuery;
    }

}
