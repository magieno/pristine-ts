import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class CheetahController {
    constructor() {
    }

    @route(HttpMethod.Get, "/cheetahs")
    public list() {
    }

    @route(HttpMethod.Post, "/cheetahs")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/cheetahs/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/cheetahs/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/cheetahs/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/cheetahs/:id")
    public delete(@routeParameter("id") id: string) {
    }
}