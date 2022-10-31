import {singleton} from "tsyringe";
import {controller, route, body, routeParameter} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/api/1.0")
@singleton()
export class CurlewController {
    constructor() {
    }

    @route(HttpMethod.Get, "/curlews")
    public list() {
    }

    @route(HttpMethod.Post, "/curlews")
    public add(@body() body: any) {
    }

    @route(HttpMethod.Get, "/curlews/:id")
    public get(@routeParameter("id") id: string) {
    }

    @route(HttpMethod.Put, "/curlews/:id")
    public update(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Patch, "/curlews/:id")
    public partialUpdate(@body() body: any, @routeParameter("id") id: string) {
    }

    @route(HttpMethod.Delete, "/curlews/:id")
    public delete(@routeParameter("id") id: string) {
    }
}
