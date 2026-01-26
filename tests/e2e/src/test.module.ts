import {ResolvedClassModel} from "./models/resolved-class.model";
import {CoreModule} from "../../../packages/core/src/core.module";
import {ModuleInterface} from "../../../packages/common/src/interfaces/module.interface";
import {InjectedClass} from "./models/injected-class.model";
import {Voter1Model} from "./models/voter1.model";
import {Voter2Model} from "./models/voter2.model";
import {TestController} from "./controllers/test.controller";
import {NestedController} from "./controllers/nested.controller";
import {TestGuard} from "./guards/test.guard";
import {SecurityModule} from "@pristine-ts/security";
import {AppModuleInterface} from "@pristine-ts/common";
import {NetworkingModule} from "@pristine-ts/networking";

export const testModule: AppModuleInterface = {
    keyname: "test",
    importServices: [TestController, NestedController],
    importModules: [CoreModule, SecurityModule, NetworkingModule],
    providerRegistrations: [
        {
            token: "voter",
            useToken: Voter1Model,
        }
    ]
}
