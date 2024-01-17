import "reflect-metadata"
import {singleton} from "tsyringe";
import {PermissionManager} from "../managers/permission.manager";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

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

        return body;
    }
    @route(HttpMethod.Get, "/error")
    public errorThrown(@body() body: any, @routeParameter("id") id: string) {
        throw new Error("Error thrown");
    }
}
