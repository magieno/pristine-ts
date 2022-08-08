import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class OpossumController {
    constructor() {
    }

    @route(HttpMethod.Get, "/opossums")
    public list() {
    }

    @route(HttpMethod.Post, "/opossums")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/opossums/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/opossums/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/opossums/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/opossums/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
