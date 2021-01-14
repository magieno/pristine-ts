import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class GazelleController {
    constructor() {
    }

    @route(HttpMethod.Get, "/gazelles")
    public list() {
    }

    @route(HttpMethod.Post, "/gazelles")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/gazelles/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/gazelles/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/gazelles/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/gazelles/:id")
    public delete(@routeParameter("id") id: string) {
    }
}