import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";


@controller("/api/2.0/magieno/pristine")
export class NestedController {
    @route(HttpMethod.Get, "")
    get() {
        return {"NestedController": true}
    }

    @route(HttpMethod.Post, "")
    post(@body() body: any) {
        return body;
    }
}