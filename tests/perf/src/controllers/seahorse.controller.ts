import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class SeahorseController {
    constructor() {
    }

    @route(HttpMethod.Get, "/seahorses")
    public list() {
    }

    @route(HttpMethod.Post, "/seahorses")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/seahorses/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/seahorses/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/seahorses/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/seahorses/:id")
    public delete(@routeParameter("id") id: string) {
    }
}