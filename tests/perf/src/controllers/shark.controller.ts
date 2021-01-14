import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class SharkController {
    constructor() {
    }

    @route(HttpMethod.Get, "/sharks")
    public list() {
    }

    @route(HttpMethod.Post, "/sharks")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/sharks/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/sharks/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/sharks/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/sharks/:id")
    public delete(@routeParameter("id") id: string) {
    }
}