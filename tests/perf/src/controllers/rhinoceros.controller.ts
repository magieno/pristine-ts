import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class RhinocerosController {
    constructor() {
    }

    @route(HttpMethod.Get, "/rhinoceross")
    public list() {
    }

    @route(HttpMethod.Post, "/rhinoceross")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/rhinoceross/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/rhinoceross/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/rhinoceross/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/rhinoceross/:id")
    public delete(@routeParameter("id") id: string) {
    }
}