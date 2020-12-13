import {controller} from "../../src/decorators/controller.decorator";
import {get} from "../../src/decorators/get.decorator";
import {injectable, singleton} from "tsyringe";
import {PermissionManager} from "../managers/permission.manager";

@controller("/api/2.0")
@singleton()
export class TestController {
    constructor(private readonly permissionManager: PermissionManager) {
    }

    @get("/services")
    public list() {

    }
}