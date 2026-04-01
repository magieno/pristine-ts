import {controller, route, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/admin/notification-channels")
export class ParameterCollisionController {
    @route(HttpMethod.Get, "/{id}")
    getById(@routeParameter("id") id: string) {
        return { id };
    }

    @route(HttpMethod.Get, "/{channelId}/registrations")
    getRegistrations(@routeParameter("channelId") channelId: string) {
        return { channelId };
    }
}
