import {DataMappingNode} from "./data-mapping.node";
import {DataMappingNodeTypeEnum} from "../enums/data-mapping-node-type.enum";

/**
 * We need an array node because the behaviour when mapping an array is different. For each element in the source property,
 * we will
 */
export class ArrayDataMappingNode extends DataMappingNode {
    public type: DataMappingNodeTypeEnum = DataMappingNodeTypeEnum.ArrayDataMappingNode;


}