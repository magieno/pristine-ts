import {LoggingModuleKeyname} from "../logging.module.keyname";
import {BreadcrumbHandlerInterface} from "../interfaces/breadcrumb-handler.interface";
import {injectable, Lifecycle, scoped} from "tsyringe";
import {EventContextManager, moduleScoped, tag} from "@pristine-ts/common";
import {BreadcrumbModel} from "../models/breadcrumb.model";

@moduleScoped(LoggingModuleKeyname)
@tag("BreadcrumbHandlerInterface")
@injectable()
@scoped(Lifecycle.ContainerScoped)
export class BreadcrumbHandler implements BreadcrumbHandlerInterface {
  public breadcrumbs: { [eventId in string]: BreadcrumbModel[] } = {};

  add(eventId: string | undefined, message: string, extra?: any) {
    const resolvedEventId = eventId ?? EventContextManager.eventId();
    if (resolvedEventId === undefined) {
      // No id to file the breadcrumb under and no active event context — drop silently.
      return;
    }
    this.addBreadcrumb(resolvedEventId, new BreadcrumbModel(message, extra));
  }

  reset(eventId: string) {
    delete this.breadcrumbs[eventId];
  }

  addBreadcrumb(eventId: string, breadcrumb: BreadcrumbModel) {
    if (!this.breadcrumbs.hasOwnProperty(eventId)) {
      this.breadcrumbs[eventId] = [];
    }

    this.breadcrumbs[eventId].push(breadcrumb);
  }
}
