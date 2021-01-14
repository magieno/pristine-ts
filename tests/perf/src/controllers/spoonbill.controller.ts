import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class SpoonbillController {
    constructor() {
    }

    @route(HttpMethod.Get, "/spoonbills")
    public list() {
    }

    @route(HttpMethod.Post, "/spoonbills")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/spoonbills/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/spoonbills/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/spoonbills/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/spoonbills/:id")
    public delete(@routeParameter("id") id: string) {
    }
}