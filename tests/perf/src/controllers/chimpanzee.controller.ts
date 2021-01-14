import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class ChimpanzeeController {
    constructor() {
    }

    @route(HttpMethod.Get, "/chimpanzees")
    public list() {
    }

    @route(HttpMethod.Post, "/chimpanzees")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/chimpanzees/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/chimpanzees/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/chimpanzees/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/chimpanzees/:id")
    public delete(@routeParameter("id") id: string) {
    }
}