import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class LobsterController {
    constructor() {
    }

    @route(HttpMethod.Get, "/lobsters")
    public list() {
    }

    @route(HttpMethod.Post, "/lobsters")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/lobsters/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/lobsters/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/lobsters/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/lobsters/:id")
    public delete(@routeParameter("id") id: string) {
    }
}