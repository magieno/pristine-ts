import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class ArmadilloController {
    constructor() {
    }

    @route(HttpMethod.Get, "/armadillos")
    public list() {
    }

    @route(HttpMethod.Post, "/armadillos")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/armadillos/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/armadillos/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/armadillos/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/armadillos/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
