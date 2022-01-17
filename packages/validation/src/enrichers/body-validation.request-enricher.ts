import {RouterRequestEnricherInterface, Request, MethodRouterNode} from "@pristine-ts/networking";
import {validate} from "class-validator";
import {BadRequestHttpError} from "@pristine-ts/networking";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {ValidationModuleKeyname} from "../validation.module.keyname";
import {injectable, inject} from "tsyringe";
import { plainToClass } from 'class-transformer';
import {LogHandlerInterface} from "@pristine-ts/logging";

@moduleScoped(ValidationModuleKeyname)
@tag(ServiceDefinitionTagEnum.RouterRequestEnricher)
@injectable()
export class BodyValidationRequestEnricher implements RouterRequestEnricherInterface {
    constructor(@inject("LogHandlerInterface") private readonly loghandler: LogHandlerInterface) {
    }

    async enrichRequest(request: Request, methodNode: MethodRouterNode): Promise<Request> {
        if(methodNode.route.context.bodyValidator === undefined || methodNode.route.context.bodyValidator.classType === undefined) {
            return request;
        }

        // Validate, else reject by throwing an error.
        const mappedBody = plainToClass(methodNode.route.context.bodyValidator.classType, request.body);

        this.loghandler.debug("BodyValidationRequestEnricher", {
            request,
            methodNode,
            routeContext: methodNode.route.context,
        }, ValidationModuleKeyname)

        const errors = await validate(mappedBody);

        if(errors.length == 0) {
            return request;
        }

        throw new BadRequestHttpError("Validation error", errors);
    }
}
