import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class ChamoisController {
    constructor() {
    }

    @route(HttpMethod.Get, "/chamoiss")
    public list() {
    }

    @route(HttpMethod.Post, "/chamoiss")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/chamoiss/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/chamoiss/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/chamoiss/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/chamoiss/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
