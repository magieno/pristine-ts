import {injectable} from "tsyringe";
import {controller, HttpMethod, route} from "@pristine-ts/core";

@injectable()
@controller("/api/2.0")
export class DogsController {

    @route(HttpMethod.Get, "")
    list() {
        return [{
            name: "Peach"
        }]
    }
}