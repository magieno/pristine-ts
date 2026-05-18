import {moduleScoped, tag, traced} from "@pristine-ts/common";
import {DataMappingModuleKeyname} from "../data-mapping.module.keyname";
import {injectable} from "tsyringe";
import {DataMappingInterceptorInterface, DataMappingInterceptorUniqueKeyType} from "@pristine-ts/data-mapping-common";

@tag("DataMappingInterceptorInterface")
@moduleScoped(DataMappingModuleKeyname)
@injectable()
export class DefaultDataMappingInterceptor implements DataMappingInterceptorInterface {
  @traced()
  async afterMapping(row: any): Promise<any> {
    return row;
  }

  @traced()
  async beforeMapping(row: any): Promise<any> {
    return row;
  }

  getUniqueKey(): DataMappingInterceptorUniqueKeyType {
    return DefaultDataMappingInterceptor.name;
  }
}