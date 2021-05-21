import {RequestInterceptorInterface} from "@pristine-ts/core";
import {RouterRequestEnricherInterface, Request, MethodRouterNode} from "@pristine-ts/networking";
import {validate} from "class-validator";
import {BadRequestHttpError} from "@pristine-ts/networking";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {ValidationModuleKeyname} from "../validation.module.keyname";
import {injectable} from "tsyringe";
import { plainToClass } from 'class-transformer';

@moduleScoped(ValidationModuleKeyname)
@tag(ServiceDefinitionTagEnum.RouterRequestEnricher)
@injectable()
export class BodyValidationRequestEnricher implements RouterRequestEnricherInterface {
    async enrichRequest(request: Request, methodeNode: MethodRouterNode): Promise<Request> {
        if(methodeNode.route.context.bodyValidator === undefined || methodeNode.route.context.bodyValidator.classType === undefined) {
            return request;
        }

        // Validate, else reject by throwing an error.
        const mappedBody = plainToClass(methodeNode.route.context.bodyValidator.classType, request.body);

        const errors = await validate(mappedBody);

        if(errors.length == 0) {
            return request;
        }

        throw new BadRequestHttpError("Validation error", errors);
    }
}
