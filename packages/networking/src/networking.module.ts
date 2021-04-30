import {ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {BodyParameterDecoratorResolver} from "./resolvers/body-parameter-decorator.resolver";
import {QueryParameterDecoratorResolver} from "./resolvers/query-parameter-decorator.resolver";
import {QueryParametersDecoratorResolver} from "./resolvers/query-parameters-decorator.resolver";
import {ControllerMethodParameterDecoratorResolver} from "./resolvers/controller-method-parameter-decorator.resolver";
import {RouteParameterDecoratorResolver} from "./resolvers/route-parameter-decorator.resolver";
import {NetworkingModuleKeyname} from "./networking.module.keyname";

export * from "./decorators/decorators";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./interfaces/interfaces";
export * from "./models/models";
export * from "./nodes/nodes";
export * from "./resolvers/resolvers";
export * from "./utils/utils";

export * from "./router";

export const NetworkingModule: ModuleInterface = {
    keyname: NetworkingModuleKeyname,

    importServices: [],

    /**
     * This property allows you to custom register specific services. For example, you can assign a tag or use a factory
     * to instantiate a specific class.
     */
    providerRegistrations: [
    ],
}
