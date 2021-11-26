import {ZeroArgumentsConstructor} from "@awslabs-community-fork/dynamodb-data-marshaller";
import { PaginationOptions } from "./pagination.options";

export interface ListOptions<T> {
    classType: ZeroArgumentsConstructor<T>,
    pagination?: PaginationOptions,
}
