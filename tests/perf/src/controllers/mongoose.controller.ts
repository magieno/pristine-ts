import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class MongooseController {
    constructor() {
    }

    @route(HttpMethod.Get, "/mongooses")
    public list() {
    }

    @route(HttpMethod.Post, "/mongooses")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/mongooses/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/mongooses/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/mongooses/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/mongooses/:id")
    public delete(@routeParameter("id") id: string) {
    }
}