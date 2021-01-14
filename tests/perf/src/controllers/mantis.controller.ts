import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class MantisController {
    constructor() {
    }

    @route(HttpMethod.Get, "/mantiss")
    public list() {
    }

    @route(HttpMethod.Post, "/mantiss")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/mantiss/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/mantiss/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/mantiss/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/mantiss/:id")
    public delete(@routeParameter("id") id: string) {
    }
}