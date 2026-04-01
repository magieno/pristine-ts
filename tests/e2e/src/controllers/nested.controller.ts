import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";
import {bodyValidation} from "@pristine-ts/validation";
import {NotificationChannelRegistrationCreationOrUpdateOptions} from "../options/notification-channel-registration-creation-or-update.options";


@controller("/api/2.0/magieno/pristine")
export class NestedController {
    @route(HttpMethod.Get, "/")
    get() {
        return {"NestedController": true}
    }

    @route(HttpMethod.Post, "/")
    post(@body() body: any) {
        return body;
    }

  @bodyValidation(NotificationChannelRegistrationCreationOrUpdateOptions)
    @route(HttpMethod.Post, "{channelId}/registrations")
    register(@routeParameter("channelId") channelId: string, @body() options: NotificationChannelRegistrationCreationOrUpdateOptions) {
        return channelId;
    }
}