import {moduleScoped, Request, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {inject, injectable} from "tsyringe";
import {MethodRouterNode, RequestInterceptorInterface} from "@pristine-ts/networking";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {DataMapper} from "../mappers/data.mapper";
import {bodyMappingDecoratorMetadataKeyname} from "../decorators/body-mapping.decorator";
import {
    ClassTransformerBodyMappingContextInterface, DataMappingBuilderBodyMappingContextInterface,
    FunctionBodyMappingContextInterface
} from "../interfaces/body-mapping-context.interface";
import {plainToInstance} from "class-transformer";
import {DataMappingModuleKeyname} from "../data-mapping.module.keyname";

/**
 * This class is an interceptor that maps the body of an incoming request.
 * It is tagged as an RequestInterceptor so it can be automatically injected with the all the other RequestInterceptors.
 * It is module scoped to the Validation module so that it is only registered if the validation module is imported.
 */
@moduleScoped(DataMappingModuleKeyname)
@tag(ServiceDefinitionTagEnum.RequestInterceptor)
@injectable()
export class BodyMappingRequestInterceptor implements RequestInterceptorInterface {
    constructor(@inject("LogHandlerInterface") private readonly loghandler: LogHandlerInterface,
                private readonly dataMapper: DataMapper) {
    }

    /**
     * Intercepts the request and maps that the body to the corresponding argument passed in the `@bodyMapping` validator
     * @param request The request being intercepted.
     * @param methodNode The method node.
     */
    async interceptRequest(request: Request, methodNode: MethodRouterNode): Promise<Request> {
        const bodyMapping: ClassTransformerBodyMappingContextInterface | FunctionBodyMappingContextInterface | DataMappingBuilderBodyMappingContextInterface = methodNode.route.context[bodyMappingDecoratorMetadataKeyname];

        if(bodyMapping === undefined) {
            return request;
        }

        this.loghandler.debug("BodyMappingRequestInterceptor", {
            request,
            methodNode,
            routeContext: methodNode.route.context,
        }, DataMappingModuleKeyname)

        switch (bodyMapping.type) {
            case "classType":
                request.body = await this.dataMapper.autoMap(request.body, bodyMapping.classType);
                break;

            case "DataMappingBuilder":
                request.body = await this.dataMapper.map(bodyMapping.dataMappingBuilder, request.body, bodyMapping.destination);
                break;

            case "function":
                request.body = bodyMapping.function(request.body);
                break;
        }

        return request;
    }
}