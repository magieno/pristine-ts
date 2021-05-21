import {RequestInterceptorInterface} from "@pristine-ts/core";
import {RouterRequestEnricherInterface, Request, MethodRouterNode} from "@pristine-ts/networking";
import {validate} from "class-validator";
import {BadRequestHttpError} from "@pristine-ts/networking";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {ValidationModuleKeyname} from "../validation.module.keyname";
import {injectable} from "tsyringe";


@moduleScoped(ValidationModuleKeyname)
@tag(ServiceDefinitionTagEnum.RouterRequestEnricher)
@injectable()
export class BodyValidationRequestEnricher implements RouterRequestEnricherInterface {
    async enrichRequest(request: Request, methodeNode: MethodRouterNode): Promise<Request> {
        if(methodeNode.route.context.bodyValidator === undefined || methodeNode.route.context.bodyValidator.instance === undefined) {
            return request;
        }

        // Validate, else reject by passing an error.
        // todo: Start by mapping the request body into the instance object
        // todo: need to use class-transformer for that.
        const mappedBody = methodeNode.route.context.bodyValidator.instance;

        const errors = await validate(mappedBody);

        if(errors.length == 0) {
            return request;
        }

        throw new BadRequestHttpError("Validation error", errors);
    }
}
