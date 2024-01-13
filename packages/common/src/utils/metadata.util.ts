import {methodArgumentsMetadataKeynameConstant} from "../constants/method-arguments-metadata-keyname.constant";

export class MetadataUtil {
    static getMethodParametersMetadata(target: any, propertyKey: string | symbol): any[] {
        const methodParameters = Reflect.getMetadata(methodArgumentsMetadataKeynameConstant, target, propertyKey);

        if(methodParameters === undefined || Array.isArray(methodParameters) === false) {
            return [];
        }

        return methodParameters;
    }

    static setMethodParameterArgumentMetadata(target: any, propertyKey: string | symbol, parameterIndex: number, metadata: any) {
        const methodArguments = MetadataUtil.getMethodParametersMetadata(target, propertyKey);

        methodArguments[parameterIndex] = metadata;

        Reflect.defineMetadata(methodArgumentsMetadataKeynameConstant, methodArguments, target, propertyKey);
    }
}