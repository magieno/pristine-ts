import {DataMappingInterceptorUniqueKeyType} from "../types/data-mapping-interceptor-unique-key.type";

export interface DataMappingInterceptorInterface {
  /**
   * Every data mapping interceptor must define a unique key. Then, during the mapping, the schema can specify which
   * interceptors must be called.
   */
  getUniqueKey(): DataMappingInterceptorUniqueKeyType;

  /**
   * This method is called before the row is being mapped and normalized. It allows you to combine fields for example if that's what you want.
   * @param row
   */
  beforeMapping(row: any): Promise<any>;

  /**
   * This method is called after the row is being mapped and normalized. It can allow you to apply operations on each
   * field or combine fields for example.
   * @param row
   */
  afterMapping(row: any): Promise<any>;
}