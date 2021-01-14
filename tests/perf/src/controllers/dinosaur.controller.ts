import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class DinosaurController {
    constructor() {
    }

    @route(HttpMethod.Get, "/dinosaurs")
    public list() {
    }

    @route(HttpMethod.Post, "/dinosaurs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/dinosaurs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/dinosaurs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/dinosaurs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/dinosaurs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}