import {singleton} from "tsyringe";
import {PermissionManager} from "../managers/permission.manager";
import {controller, HttpMethod, route, body, routeParameter, guards} from "@pristine-ts/networking";
import {TestGuard} from "../guards/test.guard";

@controller("/api/2.0/guards")
@singleton()
@guards(TestGuard)
export class TestGuardsController {
    constructor(private readonly permissionManager: PermissionManager) {
    }

    @route(HttpMethod.Get, "/services")
    public list() {
        const a = 0;
    }

    @route(HttpMethod.Post, "/services")
    public add(@body() body: any) {

    }

    @route(HttpMethod.Put, "/services/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
        const a  = 0;
    }
}