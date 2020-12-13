import {controller} from "../../src/decorators/controller.decorator";
import {route} from "../../src/decorators/route.decorator";
import {singleton} from "tsyringe";
import {PermissionManager} from "../managers/permission.manager";
import {HttpMethod} from "../../src/enums/http-method.enum";
import {body} from "../../src/decorators/body.decorator";
import {routeParam} from "../../src/decorators/route-param.decorator";

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
    public update(@body() body: any, @routeParam("id") id: string) {
        const a  = 0;
    }
}