import {controller} from "../../../networking/src/decorators/controller.decorator";
import {route} from "../../../networking/src/decorators/route.decorator";
import {singleton} from "tsyringe";
import {PermissionManager} from "../managers/permission.manager";
import {HttpMethod} from "../../../networking/src/enums/http-method.enum";
import {body} from "../../../networking/src/decorators/body.decorator";
import {routeParameter} from "../../../networking/src/decorators/route-parameter.decorator";

@controller("/api/2.0")
@singleton()
export class TestController {
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