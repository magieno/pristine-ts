import {RequestInterceptorInterface} from "../interfaces/request-interceptor.interface";
import {NetworkingModuleKeyname} from "../networking.module.keyname";
import {injectable, inject} from "tsyringe";
import {moduleScoped, Request, Response, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {MethodRouterNode} from "../nodes/method-router.node";

/**
 * This Interceptor removes all stack, traces, etc.. before the response is returned. You can deactivate it using a config.
 */
@tag(ServiceDefinitionTagEnum.RequestInterceptor)
@moduleScoped(NetworkingModuleKeyname)
@injectable()
export class ErrorResponseSanitizerRequestInterceptor implements RequestInterceptorInterface {

  constructor(
    @inject(`%${NetworkingModuleKeyname}.error_response_sanitizer.is_active%`) private readonly isActive: boolean,
  ) {
  }

  async interceptError(error: Error,  response: Response, request: Request, methodNode?: MethodRouterNode): Promise<Response> {
    if(typeof response.body !== "object" && !Array.isArray(response.body)) {
      return response;
    }

    delete response.body.stack;
    delete response.body.extra;

    return response;
  }
}