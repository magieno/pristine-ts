import {LoggingModuleKeyname} from "../logging.module.keyname";
import {BreadcrumbHandlerInterface} from "../interfaces/breadcrumb-handler.interface";
import {injectable, injectAll, singleton, inject, scoped, Lifecycle} from "tsyringe";
import {
  ServiceDefinitionTagEnum,
  tag,
  TracingContext,
  InternalContainerParameterEnum,
  moduleScoped
} from "@pristine-ts/common";
import {BreadcrumbModel} from "../models/breadcrumb.model";

@moduleScoped(LoggingModuleKeyname)
@tag("BreadcrumbHandlerInterface")
@injectable()
@scoped(Lifecycle.ContainerScoped)
export class BreadcrumbHandler implements BreadcrumbHandlerInterface {
  public breadcrumbs: BreadcrumbModel[] = [];

  add(message: string, extra?:any) {
    this.addBreadcrumb(new BreadcrumbModel(message, extra));
  }

  reset() {
    this.breadcrumbs = [];
  }

  addBreadcrumb(breadcrumb: BreadcrumbModel) {
    this.breadcrumbs.push(breadcrumb);
  }
}