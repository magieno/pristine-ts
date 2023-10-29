import {DataTransformerInterceptor} from "../interfaces/data-transformer-interceptor.interface";
import {moduleScoped, tag} from "@pristine-ts/common";
import {DataTransformerModuleKeyname} from "../data-transformer.module.keyname";
import {injectable} from "tsyringe";
import {DataTransformerRow} from "../types/data-transformer.row";
import {DataTransformerInterceptorUniqueKeyType} from "../types/data-transformer-interceptor-unique-key.type";

@tag("DataTransformerInterceptor")
@moduleScoped(DataTransformerModuleKeyname)
@injectable()
export class DefaultDataTransformerInterceptor implements DataTransformerInterceptor {
    async afterRowTransform(row: DataTransformerRow): Promise<DataTransformerRow> {
        return row;
    }

    async beforeRowTransform(row: DataTransformerRow): Promise<DataTransformerRow> {
        return row;
    }

    getUniqueKey(): DataTransformerInterceptorUniqueKeyType {
        return DefaultDataTransformerInterceptor.name;
    }
}