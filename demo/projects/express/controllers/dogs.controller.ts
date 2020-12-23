import {injectable} from "tsyringe";
import {controller} from "../../../../packages/core/src/decorators/controller.decorator";
import {route} from "../../../../packages/core/src/decorators/route.decorator";
import {HttpMethod} from "../../../../packages/core/src/enums/http-method.enum";

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