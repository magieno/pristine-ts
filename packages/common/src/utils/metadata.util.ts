import "reflect-metadata"
import {methodArgumentsMetadataKeynameConstant} from "../constants/method-arguments-metadata-keyname.constant";
import {routeContextMetadataKeynameConstant} from "../constants/route-context-metadata-keyname.constant";
import {ClassMetadata, MethodMetadata} from "@pristine-ts/metadata";

export class MetadataUtil {
    /**
     * This method returns an array of the MethodParameters metadata. It allows you to easily retrieve the metadata
     * you have assigned to each individual parameters of a method.
     *
     * @param target
     * @param propertyKey
     */
    static getMethodParametersMetadata(target: any, propertyKey: string | symbol): any[] {
        const methodParameters = MethodMetadata.getMetadata(target, propertyKey, methodArgumentsMetadataKeynameConstant);

        if(methodParameters === undefined || Array.isArray(methodParameters) === false) {
            return [];
        }

        return methodParameters;
    }

    /**
     * This method sets the metadata for a specific method parameter.
     *
     * @param target
     * @param propertyKey
     * @param parameterIndex
     * @param metadata
     */
    static setMethodParameterArgumentMetadata(target: any, propertyKey: string | symbol, parameterIndex: number, metadata: any) {
        const methodArguments = MetadataUtil.getMethodParametersMetadata(target, propertyKey);

        methodArguments[parameterIndex] = metadata;

        MethodMetadata.defineMetadata(target, propertyKey, methodArgumentsMetadataKeynameConstant, methodArguments);
    }

    /**
     * This method the RouteContext metadata either for the `target` or for at the `propertyKey` if specified.
     * @param target
     * @param propertyKey
     */
    static getRouteContext(target: any, propertyKey?: string | symbol) {
        let routeContext;

        if(propertyKey === undefined) {
            routeContext = ClassMetadata.getMetadata(target.prototype, routeContextMetadataKeynameConstant);
        } else {
            routeContext = MethodMetadata.getMetadata(target, propertyKey, routeContextMetadataKeynameConstant);
        }

        if(routeContext === undefined || typeof routeContext !== "object") {
            return {};
        }

        return routeContext;
    }

    /**
     * This method appends the `metadata` at `metadataKeyname` property in the Route Context. It intelligently checks
     * if the `propertyKey` is `undefined` or not and appends it either to the `target` or to the `propertyKey` appropriately.
     *
     * @param metadataKeyname
     * @param metadata
     * @param target
     * @param propertyKey
     */
    static setToRouteContext(metadataKeyname: string, metadata:any, target: any, propertyKey?: string | symbol) {
        const routeContext = MetadataUtil.getRouteContext(target, propertyKey);

        routeContext[metadataKeyname] = metadata;

        if(propertyKey === undefined) {
            // When there are no properties, the metadata is defined on the prototype.
            ClassMetadata.defineMetadata(target.prototype, routeContextMetadataKeynameConstant, routeContext);
        } else {
            MethodMetadata.defineMetadata(target, propertyKey, routeContextMetadataKeynameConstant, routeContext);
        }

    }
}