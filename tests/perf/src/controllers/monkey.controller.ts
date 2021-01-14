import {singleton} from "tsyringe";
import {controller, HttpMethod, route, body, routeParameter} from "@pristine-ts/networking";

@controller("/api/1.0")
@singleton()
export class MonkeyController {
    constructor() {
    }

    @route(HttpMethod.Get, "/monkeys")
    public list() {
    }

    @route(HttpMethod.Post, "/monkeys")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/monkeys/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/monkeys/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/monkeys/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/monkeys/:id")
    public delete(@routeParameter("id") id: string) {
    }
}