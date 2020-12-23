import {injectable} from "tsyringe";
import {controller} from "@pristine-ts/core/dist/types/decorators/controller.decorator";
import {route} from "@pristine-ts/core/dist/types/decorators/route.decorator";
import {HttpMethod} from "@pristine-ts/core/dist/types/enums/http-method.enum";

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