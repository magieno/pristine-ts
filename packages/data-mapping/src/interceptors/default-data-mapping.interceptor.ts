import {DataMappingInterceptorInterface} from "../interfaces/data-mapping-interceptor.interface";
import {moduleScoped, tag} from "@pristine-ts/common";
import {DataMappingModuleKeyname} from "../data-mapping.module.keyname";
import {injectable} from "tsyringe";
import {DataMappingInterceptorUniqueKeyType} from "../types/data-mapping-interceptor-unique-key.type";

@tag("DataTransformerInterceptor")
@moduleScoped(DataMappingModuleKeyname)
@injectable()
export class DefaultDataMappingInterceptor implements DataMappingInterceptorInterface {
    async afterMapping(row: any): Promise<any> {
        return row;
    }

    async beforeMapping(row: any): Promise<any> {
        return row;
    }

    getUniqueKey(): DataMappingInterceptorUniqueKeyType {
        return DefaultDataMappingInterceptor.name;
    }
}