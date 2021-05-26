import {injectable} from "tsyringe";
import {body, controller, identity, responseHeader, route, routeParameter} from "@pristine-ts/networking";
import {HttpMethod, IdentityInterface} from "@pristine-ts/common";
import {LogHandler} from "@pristine-ts/logging";
import {AwsCognitoAuthenticator, AwsCognitoGroupGuard} from "@pristine-ts/aws-cognito";
import {authenticator, guard} from "@pristine-ts/security";
import {BodyOptions} from "../options/body.options";
import {bodyValidation} from "@pristine-ts/validation";

@injectable()
@controller("/api/admin/demo")
@authenticator(AwsCognitoAuthenticator)
@guard(AwsCognitoGroupGuard, {groups: ["ADMIN"]})
@responseHeader("Cache-Control", "no-cache")
export class DemoController {
    constructor(private readonly logHandler: LogHandler){}

    @route(HttpMethod.Get, "")
    @bodyValidation(BodyOptions)
    async list(@identity() identity: IdentityInterface, @body() body: BodyOptions) {
        this.logHandler.debug("Identity", {identity});

        return
    }
}
