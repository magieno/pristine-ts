import {ResolvedClassModel} from "./models/resolved-class.model";
import {CoreModule} from "../src/core.module";
import {ModuleInterface} from "../src/interfaces/module.interface";
import {InjectedClass} from "./models/injected-class.model";

export const testModule: ModuleInterface = {
    importModules: [CoreModule],
    providerRegistrations: [
        {
            token: ResolvedClassModel,
            useValue: new ResolvedClassModel(new InjectedClass()),
        },
        {
            token: "allo",
            useToken: ResolvedClassModel,
        },
        {
            token: "allo",
            useToken: InjectedClass,
        }
    ]
}