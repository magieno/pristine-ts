import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class PorcupineController {
    constructor() {
    }

    @route(HttpMethod.Get, "/porcupines")
    public list() {
    }

    @route(HttpMethod.Post, "/porcupines")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/porcupines/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/porcupines/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/porcupines/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/porcupines/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
