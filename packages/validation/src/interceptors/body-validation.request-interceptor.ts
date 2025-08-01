import {
  BadRequestHttpError,
  MethodRouterNode,
  RequestInterceptorInterface,
  RequestInterceptorPriorityEnum
} from "@pristine-ts/networking";
import {Validator} from "@pristine-ts/class-validator";
import {moduleScoped, Request, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {ValidationModuleKeyname} from "../validation.module.keyname";
import {inject, injectable} from "tsyringe";
import {BreadcrumbHandlerInterface, LogHandlerInterface} from "@pristine-ts/logging";
import {bodyValidationMetadataKeyname} from "../decorators/body-validation.decorator";
import {DataMapper} from "@pristine-ts/data-mapping-common";

/**
 * This class is an interceptor to validate the body of an incoming request.
 * It is tagged as an RequestInterceptor so it can be automatically injected with the all the other RequestInterceptors.
 * It is module scoped to the Validation module so that it is only registered if the validation module is imported.
 */
@moduleScoped(ValidationModuleKeyname)
@tag(ServiceDefinitionTagEnum.RequestInterceptor)
@injectable()
export class BodyValidationRequestInterceptor implements RequestInterceptorInterface {

  priority = RequestInterceptorPriorityEnum.BodyMapping - 100;

  /**
   * This class is an interceptor to validate the body of an incoming request.
   * It is tagged as an RequestInterceptor so it can be automatically injected with the all the other RequestInterceptors.
   * It is module scoped to the Validation module so that it is only registered if the validation module is imported.
   * @param loghandler The log handler to output logs.
   * @param validator The validator that validates objects.
   * @param dataMapper
   * @param breadcrumbHandler
   */
  constructor(@inject("LogHandlerInterface") private readonly loghandler: LogHandlerInterface,
              private readonly validator: Validator,
              private readonly dataMapper: DataMapper,
              @inject("BreadcrumbHandlerInterface") private readonly breadcrumbHandler: BreadcrumbHandlerInterface,
  ) {
  }

  /**
   * Intercepts the request and validates that the body of the request matches the expected class.
   * It also validates the content of properties using the class-validator library.
   * @param request The request being intercepted.
   * @param methodNode The method node.
   */
  async interceptRequest(request: Request, methodNode: MethodRouterNode): Promise<Request> {
    this.breadcrumbHandler.add(request.id, `${ValidationModuleKeyname}:body-validation.request-interceptor:enter`, {
      request,
      methodNode
    });
    const bodyValidator = methodNode.route.context[bodyValidationMetadataKeyname];

    if (bodyValidator === undefined || bodyValidator.classType === undefined) {
      return request;
    }

    this.loghandler.debug("BodyValidationRequestInterceptor", {
      request,
      methodNode,
      routeContext: methodNode.route.context,
    })

    // Validates that the body can be mapped to the expected type
    const mappedBody = await this.dataMapper.autoMap(request.body, bodyValidator.classType);

    // Validates if all the conditions are respected in the expected type.
    const errors = await this.validator.validate(mappedBody);

    if (errors.length == 0) {
      return request;
    }


    this.loghandler.error(`Error validating body of request.`, {
      eventId: request.id,
      eventGroupId: request.groupId,
      highlights: {
        errors,
        mappedBody,
      },
      extra: {
        request,
        methodNode,
        routeContext: methodNode.route.context,
      },
    })

    // If we received some error while validating we reject by throwing an error.
    throw new BadRequestHttpError("Validation error", errors);
  }
}
