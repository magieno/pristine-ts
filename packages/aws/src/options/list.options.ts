import {ZeroArgumentsConstructor} from "@awslabs-community-fork/dynamodb-data-marshaller";
import { PaginationOptions } from "./pagination.options";

/**
 * Options to pass when using a Dynamodb query that returns a list.
 */
export interface ListOptions<T> {
    /**
     * The class type of the elements being returned.
     */
    classType: ZeroArgumentsConstructor<T>,

    /**
     * The pagination options.
     */
    pagination?: PaginationOptions,
}
